# MCP 服务规划

> 在现有 pnpm monorepo 中新增 `apps/mcp` 目录，作为独立的 MCP 服务层，对外暴露 AI 工具接口，通过 API Key 鉴权后调用已有 NestJS API，不直接访问数据库。

---

## 为什么要独立目录

MCP 服务职责与 API/Web 完全不同：

| 服务 | 职责 | 鉴权方式 | 消费方 |
|---|---|---|---|
| `apps/api` | 业务 REST 接口 | JWT Token | Web 前端 |
| `apps/web` | Next.js 前端 | — | 浏览器用户 |
| `apps/mcp` (新增) | MCP 协议服务器 | API Key | 外部 AI 客户端 |

独立目录的好处：独立部署、独立扩缩容、不影响现有服务、权限边界清晰。

---

## 整体架构

```
外部 AI 客户端
  Claude Desktop
  Cursor Agent          ──[Bearer <api_key>]──→  apps/mcp（MCP 服务）
  第三方 AI 应用                                       │
                                                       │ API Key 验证
                                                       │
                                              ──[Bearer <service_token>]──→  apps/api（NestJS）
                                                                                   │
                                                                              PostgreSQL
```

**核心设计原则：MCP 服务不直连数据库，只调用已有 API。** 所有业务校验、权限逻辑仍在 NestJS 中统一维护。

---

## 目录结构

```
apps/mcp/
├── package.json
├── tsconfig.json
├── .env                     # MCP_SERVICE_TOKEN, API_BASE_URL, PORT
├── src/
│   ├── index.ts             # 入口：HTTP 服务器 + MCP 注册
│   ├── auth/
│   │   └── api-key.ts       # API Key 验证逻辑（sha256 查库 + scope 检查）
│   ├── client/
│   │   └── api.ts           # 内部 axios 实例，带 MCP_SERVICE_TOKEN
│   └── tools/
│       ├── customers.ts     # 客户相关工具
│       ├── inspections.ts   # 巡检相关工具
│       └── experiments.ts   # 试验相关工具
```

---

## 暴露的 MCP Tools

### 只读工具（7 个）

| 工具名 | 说明 |
|---|---|
| `list_customers` | 搜索客户列表（企业名 / 联系人 / 联系方式） |
| `get_customer` | 获取客户详情，含最近巡检 / 试验 / 操作日志 |
| `list_inspections` | 查询巡检记录 |
| `get_inspection` | 获取巡检详情 |
| `list_experiments` | 查询试验记录 |
| `get_experiment` | 获取试验详情 |
| `list_employees` | 获取员工列表（仅 name / role，强制过滤敏感字段） |

### 关键写工具（2 个）

| 工具名 | 说明 |
|---|---|
| `add_inspection_log` | 记录巡检操作日志 |
| `add_customer_note` | 给客户添加备注日志 |

---

## 安全方案

### 1. 鉴权模型：应用级 API Key

每一个接入的 AI 应用（Claude Desktop、Cursor、第三方 SaaS 等）发一个 Key，Key 本身决定该应用能做什么，与具体是哪个员工在操作无关。

```
管理员（Web 后台）
  └─ 创建 API Key → 指定 name + scope（READ_ONLY / READ_WRITE）
                  → 原始 key 只在创建时返回一次
                  → 数据库存 sha256(key)

Cursor Agent  ── Key-A (scope=READ_WRITE) ──→ MCP 服务 ──→ 验证 sha256 + scope
Claude Desktop ── Key-B (scope=READ_ONLY) ──→ MCP 服务 ──→ 验证 sha256 + scope
```

**数据库模型**（在 `apps/api/prisma/schema.prisma` 新增）：

```prisma
model ApiKey {
  id         String       @id @default(cuid())
  keyHash    String       @unique   // sha256(原始 key)，原始 key 只在创建时返回一次
  name       String                 // 标识符，如 "cursor-agent"、"claude-desktop"
  scope      ApiKeyScope            // 枚举：READ_ONLY 或 READ_WRITE
  isActive   Boolean      @default(true)
  lastUsedAt DateTime?
  createdAt  DateTime     @default(now())

  @@map("api_keys")
}

enum ApiKeyScope {
  READ_ONLY   // 只能调用只读 MCP 工具
  READ_WRITE  // 可以调用读写 MCP 工具
}
```

**鉴权流程：**

1. MCP 服务从请求 Header 提取 `Authorization: Bearer <raw_key>`
2. 对 raw_key 做 `sha256` → 查 `api_keys` 表，验证 `isActive`
3. 根据 `scope` 决定允许调用哪些工具（READ_ONLY 调写工具 → 403）
4. 更新 `lastUsedAt`，继续处理请求

### 2. Service Token（MCP → API 内部通信）

MCP 服务内部维护一个 **Service Account**（ADMIN 角色）的 JWT，通过环境变量 `MCP_SERVICE_TOKEN` 注入。所有 MCP 工具调用内部 API 时统一用这个 token，NestJS API 不感知是哪个外部应用在调用。

```
外部 AI 应用 ──[Key-A / Key-B]──→ MCP（验证 Key）──[SERVICE_TOKEN]──→ NestJS API
```

对外暴露的是 Key（可随时吊销），Service Token 只在内部网络流转。

### 3. Scope 与工具的映射关系

| MCP 工具 | 所需 scope |
|---|---|
| list_customers / get_customer | READ_ONLY |
| list_inspections / get_inspection | READ_ONLY |
| list_experiments / get_experiment | READ_ONLY |
| list_employees | READ_ONLY |
| add_inspection_log | READ_WRITE |
| add_customer_note | READ_WRITE |

### 4. 数据脱敏

`list_employees` 工具在 MCP 层强制过滤，只返回 `{id, name, role, gender}`，不暴露 phone / email / password 等字段，即使底层调用了 `/api/employees`。

### 5. 其他防护

- **频率限制**：每个 API Key 60 次/分钟，用 `express-rate-limit` + Key hash 作限流 key
- **二次检查**：写工具运行前再次验证 `scope === READ_WRITE`
- **端口隔离**：MCP 服务端口 3003 不直接对外，经 Nginx 反代统一入口
- **即时吊销**：`isActive = false` 后下次请求立刻拒绝

---

## Nginx 路由分配（服务器）

```nginx
# 现有
location /api/ {
    proxy_pass http://localhost:3001;
}

# 新增
location /mcp/ {
    proxy_pass http://localhost:3003;
}

# 静态前端（现有）
location / {
    root /opt/hongyi/apps/web/out;
    try_files $uri $uri.html $uri/index.html /index.html;
}
```

---

## 部署方式

| 项目 | 端口 | PM2 进程名 |
|---|---|---|
| apps/api | 3001 | hongyi-api（现有） |
| apps/mcp | 3003 | hongyi-mcp（新增） |
| apps/web | 静态文件 | —（Nginx 直接服务） |

**`apps/mcp/.env` 所需变量：**

```env
PORT=3003
API_BASE_URL=http://localhost:3001/api
MCP_SERVICE_TOKEN=<service-account-jwt>
DATABASE_URL=<同 apps/api 的数据库连接，仅用于验证 ApiKey>
```

---

## 实现技术栈

| 依赖 | 用途 |
|---|---|
| `@modelcontextprotocol/sdk` | 官方 MCP Node.js SDK |
| `express` | HTTP 服务器（Streamable HTTP transport） |
| `axios` | 内部调用 NestJS API |
| `express-rate-limit` | API Key 频率限制 |
| `@prisma/client` | 查询 ApiKey 表做鉴权 |

---

## 实施步骤（待执行）

- [ ] `apps/api/prisma/schema.prisma` 新增 `ApiKey` 模型 + 执行迁移
- [ ] `apps/api` 新增 `/api/admin/api-keys` 管理接口（CRUD，仅 ADMIN 可操作）
- [ ] 新建 `apps/mcp` 目录，配置 `package.json` / `tsconfig.json` / pnpm workspace
- [ ] 实现 `apps/mcp/src/auth/api-key.ts`：验证 Bearer Key、检查 scope、频率限制
- [ ] 实现 `apps/mcp/src/client/api.ts`：axios 实例 + `MCP_SERVICE_TOKEN` 注入
- [ ] 实现 7 个只读工具（customers / inspections / experiments），含员工字段脱敏
- [ ] 实现 2 个写工具：`add_inspection_log` / `add_customer_note`
- [ ] 实现 `apps/mcp/src/index.ts`：HTTP Streamable Transport 服务入口
- [ ] 更新服务器 Nginx 配置增加 `/mcp/*` 路由，PM2 增加 `hongyi-mcp` 进程
