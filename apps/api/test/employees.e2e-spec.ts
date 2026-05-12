import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { buildSeed, SEEDS } from './seed'

const prisma = new PrismaClient()

describe('Employees API (e2e)', () => {
  let app: INestApplication
  let adminToken: string
  let hdDeptToken: string
  let hdStaffToken: string
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

    ;[adminToken, hdDeptToken, hdStaffToken, gridDeptToken, gridStaffToken] = await Promise.all([
      login(SEEDS.admin.phone, SEEDS.admin.password),
      login(SEEDS.hdDept.phone, SEEDS.hdDept.password),
      login(SEEDS.hdStaff.phone, SEEDS.hdStaff.password),
      login(SEEDS.gridDept.phone, SEEDS.gridDept.password),
      login(SEEDS.gridStaff.phone, SEEDS.gridStaff.password),
    ])
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  // ── 1. No token ──────────────────────────────────────────────────────
  it('GET /employees → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/employees').expect(401)
  })

  // ── 2. HAODING STAFF → 403 ───────────────────────────────────────────
  it('GET /employees → 403 for HAODING STAFF role', async () => {
    await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(403)
  })

  // ── 3. STATE_GRID STAFF → 403 ────────────────────────────────────────
  it('GET /employees → 403 for STATE_GRID STAFF role', async () => {
    await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .expect(403)
  })

  // ── 4. HAODING DEPT_MANAGER 只看到皓鼎员工 ──────────────────────────
  it('GET /employees → 200, HAODING DEPT_MANAGER sees only HAODING employees', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    // All returned employees must belong to HAODING_HONGYI
    for (const emp of res.body.items) {
      expect(emp.company).toBe('HAODING_HONGYI')
    }
    // Should include the seed HAODING employees (at least hdDept and hdStaff)
    const ids = res.body.items.map((e: any) => e.id)
    expect(ids).toContain(SEEDS.hdDept.id)
    expect(ids).toContain(SEEDS.hdStaff.id)
    // Should NOT include STATE_GRID employees
    expect(ids).not.toContain(SEEDS.gridDept.id)
    expect(ids).not.toContain(SEEDS.gridStaff.id)
  })

  // ── 5. STATE_GRID DEPT_MANAGER 只看到国网员工 ────────────────────────
  it('GET /employees → 200, STATE_GRID DEPT_MANAGER sees only STATE_GRID employees', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(Array.isArray(res.body.items)).toBe(true)
    // All returned employees must belong to STATE_GRID
    for (const emp of res.body.items) {
      expect(emp.company).toBe('STATE_GRID')
    }
    const ids = res.body.items.map((e: any) => e.id)
    expect(ids).toContain(SEEDS.gridDept.id)
    expect(ids).toContain(SEEDS.gridStaff.id)
    expect(ids).not.toContain(SEEDS.hdDept.id)
    expect(ids).not.toContain(SEEDS.hdStaff.id)
  })

  // ── 6. ADMIN 可以看到所有员工（>=5） ─────────────────────────────────
  it('GET /employees → 200 + total >= 5 for ADMIN (all companies)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.total).toBeGreaterThanOrEqual(5)
  })

  // ── 7. ADMIN 按 company 过滤 → 只返回皓鼎员工 ───────────────────────
  it('GET /employees?company=HAODING_HONGYI → returns only HAODING employees for ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/employees?company=HAODING_HONGYI')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    for (const emp of res.body.items) {
      expect(emp.company).toBe('HAODING_HONGYI')
    }
  })

  // ── 8. ADMIN 按 company=STATE_GRID 过滤 ─────────────────────────────
  it('GET /employees?company=STATE_GRID → returns only STATE_GRID employees for ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/employees?company=STATE_GRID')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.total).toBeGreaterThanOrEqual(2)
    for (const emp of res.body.items) {
      expect(emp.company).toBe('STATE_GRID')
    }
  })

  // ── 9. HAODING DEPT_MANAGER 创建员工 → company 强制为 HAODING_HONGYI ─
  it('POST /employees → 201 by HAODING DEPT_MANAGER, company forced to HAODING_HONGYI', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/employees')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({
        name: '皓鼎部门新增员工',
        gender: 'MALE',
        phone: '19900000010',
        password: 'Test@12345',
        company: 'STATE_GRID',  // 尝试越权指定其他公司
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.role).toBe('STAFF')
    // company must be forced to HAODING_HONGYI regardless of input
    expect(res.body.company).toBe('HAODING_HONGYI')
  })

  // ── 10. STATE_GRID DEPT_MANAGER 创建员工 → company 强制为 STATE_GRID ─
  it('POST /employees → 201 by STATE_GRID DEPT_MANAGER, company forced to STATE_GRID', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/employees')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .send({
        name: '电网部门新增员工',
        gender: 'FEMALE',
        phone: '19900000012',
        password: 'Test@12345',
      })
      .expect(201)
    expect(res.body.company).toBe('STATE_GRID')
  })

  // ── 11. ADMIN 创建员工并存 ID ─────────────────────────────────────────
  it('POST /employees → 201 by ADMIN with explicit company', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '管理员新增员工',
        gender: 'FEMALE',
        phone: '19900000011',
        password: 'Test@12345',
        role: 'STAFF',
        company: 'HAODING_HONGYI',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.company).toBe('HAODING_HONGYI')
    createdId = res.body.id
  })

  // ── 12. 手机号重复 → 409 ─────────────────────────────────────────────
  it('POST /employees → 409 when phone already exists', async () => {
    await request(app.getHttpServer())
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '重复手机号',
        gender: 'MALE',
        phone: SEEDS.admin.phone,
        password: 'Test@12345',
      })
      .expect(409)
  })

  // ── 13. HAODING DEPT_MANAGER 不能修改 company 字段 ───────────────────
  it('PUT /employees/:id → company cannot be changed by DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/employees/${SEEDS.hdStaff.id}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({ name: '皓鼎员工更名', company: 'STATE_GRID' })
      .expect(200)
    // company change should be silently ignored
    expect(res.body.company).toBe('HAODING_HONGYI')
    expect(res.body.name).toBe('皓鼎员工更名')
  })

  // ── 14. HAODING DEPT_MANAGER 无法操作国网员工 → 403 ─────────────────
  it('PUT /employees/:id → 403 when HAODING DEPT_MANAGER tries to edit STATE_GRID employee', async () => {
    await request(app.getHttpServer())
      .put(`/api/employees/${SEEDS.gridStaff.id}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({ name: '越权修改' })
      .expect(403)
  })

  // ── 15. DEPT_MANAGER 无法授予 DEPT_MANAGER 角色 → 403 ───────────────
  it('PUT /employees/:id → 403 when DEPT_MANAGER tries to assign DEPT_MANAGER role', async () => {
    await request(app.getHttpServer())
      .put(`/api/employees/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({ role: 'DEPT_MANAGER' })
      .expect(403)
  })

  // ── 16. ADMIN 软删除 ──────────────────────────────────────────────────
  it('DELETE /employees/:id → 200 soft-delete by ADMIN', async () => {
    await request(app.getHttpServer())
      .delete(`/api/employees/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
  })

  // ── 17. 软删除后不出现在列表中 ──────────────────────────────────────
  it('GET /employees → soft-deleted employee not in items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    const ids = res.body.items.map((e: any) => e.id)
    expect(ids).not.toContain(createdId)
  })

  // ── 18. GET 详情包含 employeeLogs 数组 ──────────────────────────────
  it('GET /employees/:id → 200 + employeeLogs array shape', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/employees/${SEEDS.admin.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(Array.isArray(res.body.employeeLogs)).toBe(true)
  })
})
