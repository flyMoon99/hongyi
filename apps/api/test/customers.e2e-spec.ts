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
  let deptToken: string
  let staffToken: string
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

    ;[adminToken, deptToken, staffToken] = await Promise.all([
      login(SEEDS.admin.phone, SEEDS.admin.password),
      login(SEEDS.dept.phone, SEEDS.dept.password),
      login(SEEDS.staff.phone, SEEDS.staff.password),
    ])
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  // ── 1. 未登录 → 401 ──────────────────────────────────────────────────
  it('GET /customers → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/customers').expect(401)
  })

  // ── 2. STAFF 可以读取列表 ─────────────────────────────────────────────
  it('GET /customers → 200 + items array for STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body).toHaveProperty('total')
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  // ── 3. 分页参数生效 ───────────────────────────────────────────────────
  it('GET /customers?page=1&pageSize=1 → items.length === 1', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?page=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.items.length).toBe(1)
    expect(res.body.pageSize).toBe(1)
  })

  // ── 4. 按企业名称搜索 ─────────────────────────────────────────────────
  it('GET /customers?companyName=测试 → returns matching customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?companyName=测试')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].companyName).toContain('测试')
  })

  // ── 5. 按联系人搜索 ───────────────────────────────────────────────────
  it('GET /customers?contactPerson=张三 → returns seed customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?contactPerson=张三')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].contactPerson).toContain('张三')
  })

  // ── 6. 按联系方式搜索 ─────────────────────────────────────────────────
  it('GET /customers?contactInfo=13011110001 → returns seed customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?contactInfo=13011110001')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].contactInfo).toContain('13011110001')
  })

  // ── 7. 不匹配的搜索返回空列表 ─────────────────────────────────────────
  it('GET /customers?companyName=不存在的企业 → empty items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers?companyName=不存在的企业XYZ999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.items.length).toBe(0)
    expect(res.body.total).toBe(0)
  })

  // ── 8. STAFF 可以查看客户详情 ─────────────────────────────────────────
  it('GET /customers/:id → 200 + detail fields for STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
    expect(res.body.id).toBe(SEEDS.customer.id)
    expect(res.body.companyName).toBe(SEEDS.customer.companyName)
    expect(Array.isArray(res.body.inspections)).toBe(true)
    expect(Array.isArray(res.body.experiments)).toBe(true)
    expect(Array.isArray(res.body.logs)).toBe(true)
  })

  // ── 9. 不存在的客户 → 404 ────────────────────────────────────────────
  it('GET /customers/nonexistent → 404', async () => {
    await request(app.getHttpServer())
      .get('/api/customers/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)
  })

  // ── 10. STAFF 无法新增客户 → 403 ─────────────────────────────────────
  it('POST /customers → 403 for STAFF role', async () => {
    await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ companyName: '无权限公司', contactPerson: '李四', contactInfo: '13000000000' })
      .expect(403)
  })

  // ── 11. ADMIN 新增客户 → 201 + 生成操作日志 ──────────────────────────
  it('POST /customers → 201 by ADMIN, customerLog created', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: '管理员新增电力公司',
        contactPerson: '王五',
        contactInfo: '13800000001',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.companyName).toBe('管理员新增电力公司')
    expect(res.body.isDeleted).toBe(false)
    createdId = res.body.id

    // verify log was recorded
    const detail = await request(app.getHttpServer())
      .get(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(detail.body.logs.length).toBeGreaterThanOrEqual(1)
    expect(detail.body.logs[0].action).toBe('创建客户')
  })

  // ── 12. DEPT_MANAGER 新增客户 → 201 ──────────────────────────────────
  it('POST /customers → 201 by DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${deptToken}`)
      .send({
        companyName: '部门负责人新增公司',
        contactPerson: '赵六',
        contactInfo: '13800000002',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
  })

  // ── 13. 可选字段为空字符串时不报错 ───────────────────────────────────
  it('POST /customers → 201 when optional fields are empty strings', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyName: '空字段测试公司',
        contactPerson: '测试人',
        contactInfo: '13800000099',
        projectOverview: '',
        lastPatrolTime: '',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
  })

  // ── 14. STAFF 无法修改客户 → 403 ─────────────────────────────────────
  it('PUT /customers/:id → 403 for STAFF role', async () => {
    await request(app.getHttpServer())
      .put(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ companyName: '越权修改' })
      .expect(403)
  })

  // ── 15. ADMIN 修改客户 → 200 + 生成更新日志 ──────────────────────────
  it('PUT /customers/:id → 200 by ADMIN, update log created', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyName: '已修改电力公司', contactPerson: '王五改名' })
      .expect(200)
    expect(res.body.companyName).toBe('已修改电力公司')

    const detail = await request(app.getHttpServer())
      .get(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    const actions = detail.body.logs.map((l: any) => l.action)
    expect(actions).toContain('更新客户')
  })

  // ── 16. STAFF 无法删除客户 → 403 ─────────────────────────────────────
  it('DELETE /customers/:id → 403 for STAFF role', async () => {
    await request(app.getHttpServer())
      .delete(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403)
  })

  // ── 17. ADMIN 软删除客户 → 200 ───────────────────────────────────────
  it('DELETE /customers/:id → 200 soft-delete by ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.message).toBe('删除成功')
  })

  // ── 18. 软删除后不出现在列表中 ───────────────────────────────────────
  it('GET /customers → soft-deleted customer not in items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    const ids = res.body.items.map((c: any) => c.id)
    expect(ids).not.toContain(createdId)
  })

  // ── 19. 软删除后详情接口 → 404 ───────────────────────────────────────
  it('GET /customers/:id → 404 for soft-deleted customer', async () => {
    await request(app.getHttpServer())
      .get(`/api/customers/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)
  })

  // ── 20. 操作日志接口分页正常 ──────────────────────────────────────────
  it('GET /customers/:id/logs → 200 + items + total for existing customer', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/customers/${SEEDS.customer.id}/logs`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('page')
  })

  // ── 21. 操作日志包含 operator 字段 ───────────────────────────────────
  it('GET /customers/:id/logs → each log has operator with id+name', async () => {
    // Use seed customer which has no logs yet; use a customer that has logs (createdId is deleted)
    // Create a fresh customer and check its create log
    const newCustomer = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyName: '日志验证公司', contactPerson: '操作人', contactInfo: '13900000001' })
    const logRes = await request(app.getHttpServer())
      .get(`/api/customers/${newCustomer.body.id}/logs`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(logRes.body.items.length).toBeGreaterThanOrEqual(1)
    const firstLog = logRes.body.items[0]
    expect(firstLog.operator).toBeDefined()
    expect(firstLog.operator.id).toBe(SEEDS.admin.id)
    expect(firstLog.operator.name).toBe(SEEDS.admin.name)
  })
})
