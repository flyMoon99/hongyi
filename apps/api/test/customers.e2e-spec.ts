import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { buildSeed, SEEDS } from './seed'

const prisma = new PrismaClient()

describe('Customers API (e2e)', () => {
  let app: INestApplication
  let adminToken: string
  let hdDeptToken: string
  let hdStaffToken: string
  let gridDeptToken: string
  let createdId: string

  beforeAll(async () => {
    await buildSeed(prisma)

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.setGlobalPrefix('api')
    await app.init()

    const login = (phone: string, password: string) =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phone, password })
        .then((r) => r.body.accessToken as string)

    ;[adminToken, hdDeptToken, hdStaffToken, gridDeptToken] = await Promise.all([
      login(SEEDS.admin.phone, SEEDS.admin.password),
      login(SEEDS.hdDept.phone, SEEDS.hdDept.password),
      login(SEEDS.hdStaff.phone, SEEDS.hdStaff.password),
      login(SEEDS.gridDept.phone, SEEDS.gridDept.password),
    ])
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  // ── 1. 未登录 → 401 ─────────────────────────────────────────────────
  it('GET /customers → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/customers').expect(401)
  })

  // ── 2. ADMIN 访问 customers → 403（ADMIN 仅允许员工模块） ────────────
  it('GET /customers → 403 for ADMIN role', async () => {
    await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  // ── 3. STATE_GRID DEPT_MANAGER 访问 customers → 403 ─────────────────
  it('GET /customers → 403 for STATE_GRID DEPT_MANAGER', async () => {
    await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(403)
  })

  // ── 4. 皓鼎 STAFF 可以读取列表 ──────────────────────────────────────
  it('GET /customers → 200 + items array for HAODING STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  // ── 5. 皓鼎负责人分页参数生效 ────────────────────────────────────────
  it('GET /customers?page=1&pageSize=1 → items.length === 1', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?page=1&pageSize=1')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.items.length).toBe(1)
    expect(res.body.pageSize).toBe(1)
  })

  // ── 6. 按企业名称搜索 ────────────────────────────────────────────────
  it('GET /customers?companyName=测试 → returns matching customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?companyName=测试')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].companyName).toContain('测试')
  })

  // ── 7. 按联系人搜索 ──────────────────────────────────────────────────
  it('GET /customers?contactPerson=张三 → returns seed customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?contactPerson=张三')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].contactPerson).toContain('张三')
  })

  // ── 8. 不匹配的搜索返回空列表 ────────────────────────────────────────
  it('GET /customers?companyName=不存在 → empty items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?companyName=不存在的企业XYZ999')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.items.length).toBe(0)
    expect(res.body.total).toBe(0)
  })

  // ── 9. 皓鼎 STAFF 可以查看客户详情 ──────────────────────────────────
  it('GET /customers/:id → 200 + detail for HAODING STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(200)
    expect(res.body.id).toBe(SEEDS.customer.id)
    expect(res.body.companyName).toBe(SEEDS.customer.companyName)
    expect(Array.isArray(res.body.inspections)).toBe(true)
    expect(Array.isArray(res.body.experiments)).toBe(true)
    expect(Array.isArray(res.body.logs)).toBe(true)
  })

  // ── 10. 不存在的客户 → 404 ───────────────────────────────────────────
  it('GET /customers/nonexistent → 404', async () => {
    await request(app.getHttpServer())
      .get('/api/customers/nonexistent-id')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(404)
  })

  // ── 11. 皓鼎 STAFF 无法新增客户 → 403 ──────────────────────────────
  it('POST /customers → 403 for HAODING STAFF', async () => {
    await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .send({ companyName: '无权限公司', contactPerson: '李四', contactInfo: '13000000000' })
      .expect(403)
  })

  // ── 12. 皓鼎负责人新增客户 → 201 + company=HAODING_HONGYI ───────────
  it('POST /customers → 201 by HAODING DEPT_MANAGER, company is HAODING_HONGYI', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({
        companyName: '负责人新增电力公司',
        contactPerson: '王五',
        contactInfo: '13800000001',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.companyName).toBe('负责人新增电力公司')
    expect(res.body.company).toBe('HAODING_HONGYI')
    createdId = res.body.id

    // 验证创建日志
    const detail = await request(app.getHttpServer())
      .get(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(detail.body.logs.length).toBeGreaterThanOrEqual(1)
    expect(detail.body.logs[0].action).toBe('创建客户')
  })

  // ── 13. 皓鼎 STAFF 无法修改客户 → 403 ──────────────────────────────
  it('PUT /customers/:id → 403 for HAODING STAFF', async () => {
    await request(app.getHttpServer())
      .put(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .send({ companyName: '越权修改' })
      .expect(403)
  })

  // ── 14. 皓鼎负责人修改客户 → 200 + 更新日志 ────────────────────────
  it('PUT /customers/:id → 200 by HAODING DEPT_MANAGER, update log created', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({ companyName: '已修改电力公司', contactPerson: '王五改名' })
      .expect(200)
    expect(res.body.companyName).toBe('已修改电力公司')

    const detail = await request(app.getHttpServer())
      .get(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    const actions = detail.body.logs.map((l: any) => l.action)
    expect(actions).toContain('更新客户')
  })

  // ── 15. 皓鼎 STAFF 无法删除客户 → 403 ──────────────────────────────
  it('DELETE /customers/:id → 403 for HAODING STAFF', async () => {
    await request(app.getHttpServer())
      .delete(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(403)
  })

  // ── 16. 皓鼎负责人软删除 → 200 ─────────────────────────────────────
  it('DELETE /customers/:id → 200 soft-delete by HAODING DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.message).toBe('删除成功')
  })

  // ── 17. 软删除后不出现在列表中 ─────────────────────────────────────
  it('GET /customers → soft-deleted customer not in items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    const ids = res.body.items.map((c: any) => c.id)
    expect(ids).not.toContain(createdId)
  })

  // ── 18. 软删除后详情 → 404 ──────────────────────────────────────────
  it('GET /customers/:id → 404 for soft-deleted customer', async () => {
    await request(app.getHttpServer())
      .get(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(404)
  })

  // ── 19. 操作日志接口正常 ─────────────────────────────────────────────
  it('GET /customers/:id/logs → 200 + items + total', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/customers/${SEEDS.customer.id}/logs`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('page')
  })
})
