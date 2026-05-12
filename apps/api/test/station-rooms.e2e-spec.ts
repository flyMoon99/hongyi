import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { buildSeed, SEEDS } from './seed'

const prisma = new PrismaClient()

describe('Station Rooms API (e2e)', () => {
  let app: INestApplication
  let adminToken: string
  let hdDeptToken: string
  let gridDeptToken: string
  let gridStaffToken: string
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

    ;[adminToken, hdDeptToken, gridDeptToken, gridStaffToken] = await Promise.all([
      login(SEEDS.admin.phone, SEEDS.admin.password),
      login(SEEDS.hdDept.phone, SEEDS.hdDept.password),
      login(SEEDS.gridDept.phone, SEEDS.gridDept.password),
      login(SEEDS.gridStaff.phone, SEEDS.gridStaff.password),
    ])
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  // ── 1. 未登录 → 401 ─────────────────────────────────────────────────
  it('GET /station-rooms → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/station-rooms').expect(401)
  })

  // ── 2. ADMIN → 403 ──────────────────────────────────────────────────
  it('GET /station-rooms → 403 for ADMIN', async () => {
    await request(app.getHttpServer())
      .get('/api/station-rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  // ── 3. HAODING DEPT_MANAGER → 403 ───────────────────────────────────
  it('GET /station-rooms → 403 for HAODING DEPT_MANAGER', async () => {
    await request(app.getHttpServer())
      .get('/api/station-rooms')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(403)
  })

  // ── 4. STATE_GRID STAFF 可以读取列表 ────────────────────────────────
  it('GET /station-rooms → 200 + items array for STATE_GRID STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/station-rooms')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  // ── 5. STATE_GRID STAFF 无法新增 → 403 ──────────────────────────────
  it('POST /station-rooms → 403 for STATE_GRID STAFF', async () => {
    await request(app.getHttpServer())
      .post('/api/station-rooms')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .send({
        name: '越权站室',
        contactPerson: '张三',
        contactInfo: '13000000001',
      })
      .expect(403)
  })

  // ── 6. STATE_GRID DEPT_MANAGER 新增站室 → 201 ───────────────────────
  it('POST /station-rooms → 201 by STATE_GRID DEPT_MANAGER, company=STATE_GRID', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/station-rooms')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .send({
        name: '新增测试站室',
        remark: '测试备注',
        contactPerson: '王电工',
        contactInfo: '13800008888',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('新增测试站室')
    expect(res.body.company).toBe('STATE_GRID')
    createdId = res.body.id
  })

  // ── 7. 列表返回 items/total/page/pageSize ────────────────────────────
  it('GET /station-rooms?page=1&pageSize=5 → pagination fields present', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/station-rooms?page=1&pageSize=5')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('page')
    expect(res.body).toHaveProperty('pageSize')
    expect(res.body.page).toBe(1)
    expect(res.body.pageSize).toBe(5)
  })

  // ── 8. 搜索参数生效 ─────────────────────────────────────────────────
  it('GET /station-rooms?search=新增测试 → returns matching station room', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/station-rooms?search=新增测试')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].name).toContain('新增测试')
  })

  // ── 9. GET 详情 → 200 + logs 数组 ───────────────────────────────────
  it('GET /station-rooms/:id → 200 + logs array by STATE_GRID DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/station-rooms/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body.id).toBe(createdId)
    expect(res.body.name).toBe('新增测试站室')
    expect(Array.isArray(res.body.logs)).toBe(true)
    expect(res.body.logs.length).toBeGreaterThanOrEqual(1)
    expect(res.body.logs[0].action).toBe('新增站室')
  })

  // ── 10. STATE_GRID STAFF 也能查看详情 ───────────────────────────────
  it('GET /station-rooms/:id → 200 by STATE_GRID STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/station-rooms/${createdId}`)
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .expect(200)
    expect(res.body.id).toBe(createdId)
  })

  // ── 11. PUT 修改 → 200 ──────────────────────────────────────────────
  it('PUT /station-rooms/:id → 200 by STATE_GRID DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/station-rooms/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .send({ name: '已修改站室名', remark: '已更新备注' })
      .expect(200)
    expect(res.body.name).toBe('已修改站室名')
    expect(res.body.remark).toBe('已更新备注')
  })

  // ── 12. STATE_GRID STAFF 无法修改 → 403 ─────────────────────────────
  it('PUT /station-rooms/:id → 403 for STATE_GRID STAFF', async () => {
    await request(app.getHttpServer())
      .put(`/api/station-rooms/${createdId}`)
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .send({ name: '越权修改' })
      .expect(403)
  })

  // ── 13. DELETE 软删除 → 200 ─────────────────────────────────────────
  it('DELETE /station-rooms/:id → 200 soft-delete by STATE_GRID DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/station-rooms/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body.message).toBe('删除成功')
  })

  // ── 14. 软删除后不出现在列表 ─────────────────────────────────────────
  it('GET /station-rooms → soft-deleted station room not in items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/station-rooms')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    const ids = res.body.items.map((r: any) => r.id)
    expect(ids).not.toContain(createdId)
  })

  // ── 15. 不存在或已删除的站室 → 404 ──────────────────────────────────
  it('GET /station-rooms/:id → 404 for soft-deleted station room', async () => {
    await request(app.getHttpServer())
      .get(`/api/station-rooms/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(404)
  })
})
