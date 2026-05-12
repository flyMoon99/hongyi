import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { buildSeed, SEEDS } from './seed'

const prisma = new PrismaClient()

describe('Inspections API (e2e)', () => {
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

  // ── 1. No token → 401 ────────────────────────────────────────────────
  it('GET /inspections → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/inspections').expect(401)
  })

  // ── 2. ADMIN → 403（仅允许员工模块）────────────────────────────────
  it('GET /inspections → 403 for ADMIN role', async () => {
    await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  // ── 3. STATE_GRID DEPT_MANAGER → 403 ────────────────────────────────
  it('GET /inspections → 403 for STATE_GRID DEPT_MANAGER', async () => {
    await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(403)
  })

  // ── 4. HAODING STAFF 可以读取列表 ────────────────────────────────────
  it('GET /inspections → 200 + items array for HAODING STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  // ── 5. HAODING DEPT_MANAGER 可以读取列表 ─────────────────────────────
  it('GET /inspections → 200 + total >= 1 for HAODING DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  // ── 6. GET detail → 200 + responsiblePerson + logs ───────────────────
  it('GET /inspections/:id → 200 + responsiblePerson + logs by HAODING DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/inspections/${SEEDS.inspection.id}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.id).toBe(SEEDS.inspection.id)
    expect(res.body.responsiblePerson).toBeDefined()
    expect(res.body.responsiblePerson.id).toBe(SEEDS.hdStaff.id)
    expect(Array.isArray(res.body.logs)).toBe(true)
    expect(res.body.customer).toBeDefined()
    expect(res.body.customer.companyName).toBe(SEEDS.customer.companyName)
  })

  // ── 7. POST missing responsiblePersonId → 400 ────────────────────────
  it('POST /inspections → 400 when responsiblePersonId is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({
        customerId: SEEDS.customer.id,
        frequency: 'QUARTERLY',
        powerEquipment: '开关柜',
        contactPerson: '测试员',
        contactInfo: '13900000001',
      })
      .expect(400)
  })

  // ── 8. HAODING STAFF 无法新增 → 403 ─────────────────────────────────
  it('POST /inspections → 403 for HAODING STAFF', async () => {
    await request(app.getHttpServer())
      .post('/api/inspections')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .send({
        customerId: SEEDS.customer.id,
        responsiblePersonId: SEEDS.hdStaff.id,
        frequency: 'QUARTERLY',
        powerEquipment: '10kV开关柜',
        contactPerson: '职员联系人',
        contactInfo: '13900000002',
      })
      .expect(403)
  })

  // ── 9. HAODING DEPT_MANAGER 新增巡检 → 201 + company=HAODING_HONGYI ─
  it('POST /inspections → 201 by HAODING DEPT_MANAGER, stores createdId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({
        customerId: SEEDS.customer.id,
        responsiblePersonId: SEEDS.hdStaff.id,
        frequency: 'QUARTERLY',
        powerEquipment: '110kV变压器',
        contactPerson: '管理联系人',
        contactInfo: '13900000003',
        safetyTools: '绝缘手套',
      })
      .expect(201)
    createdId = res.body.id
    expect(createdId).toBeDefined()
    expect(res.body.company).toBe('HAODING_HONGYI')
  })

  // ── 10. HAODING STAFF 无法修改 → 403 ────────────────────────────────
  it('PUT /inspections/:id → 403 for HAODING STAFF', async () => {
    await request(app.getHttpServer())
      .put(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .send({ contactPerson: '职员越权' })
      .expect(403)
  })

  // ── 11. HAODING DEPT_MANAGER 可以修改 → 200 ─────────────────────────
  it('PUT /inspections/:id → 200 by HAODING DEPT_MANAGER, fields updated', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({ contactPerson: '负责人已更新', powerEquipment: '已修改设备' })
      .expect(200)
    expect(res.body.contactPerson).toBe('负责人已更新')
    expect(res.body.powerEquipment).toBe('已修改设备')
  })

  // ── 12. HAODING STAFF 无法删除 → 403 ────────────────────────────────
  it('DELETE /inspections/:id → 403 for HAODING STAFF', async () => {
    await request(app.getHttpServer())
      .delete(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(403)
  })

  // ── 13. HAODING DEPT_MANAGER 软删除 → 200 ───────────────────────────
  it('DELETE /inspections/:id → 200 soft-delete by HAODING DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.message).toBe('删除成功')
  })

  // ── 14. 软删除后不出现在列表中 ───────────────────────────────────────
  it('GET /inspections → soft-deleted record not in items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    const ids = res.body.items.map((i: any) => i.id)
    expect(ids).not.toContain(createdId)
  })

  // ── 15. 分页参数生效 ──────────────────────────────────────────────────
  it('GET /inspections?page=1&pageSize=1 → items.length === 1', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections?page=1&pageSize=1')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(200)
    expect(res.body.items.length).toBe(1)
    expect(res.body.pageSize).toBe(1)
  })

  // ── 16. seed 记录详情有 logs 数组 ────────────────────────────────────
  it('GET /inspections/:id → logs array exists', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/inspections/${SEEDS.inspection.id}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(200)
    expect(Array.isArray(res.body.logs)).toBe(true)
  })
})
