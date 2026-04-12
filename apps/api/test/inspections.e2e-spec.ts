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

  // ── 1. No token → 401 ────────────────────────────────────────────────
  it('GET /inspections → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/inspections').expect(401)
  })

  // ── 2. STAFF can read list ────────────────────────────────────────────
  it('GET /inspections → 200 + items array for STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  // ── 3. ADMIN can read list ────────────────────────────────────────────
  it('GET /inspections → 200 + total >= 1 for ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  // ── 4. GET detail → 200 + responsiblePerson + logs ───────────────────
  it('GET /inspections/:id → 200 + responsiblePerson field + logs array', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/inspections/${SEEDS.inspection.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.id).toBe(SEEDS.inspection.id)
    expect(res.body.responsiblePerson).toBeDefined()
    expect(res.body.responsiblePerson.id).toBe(SEEDS.staff.id)
    expect(Array.isArray(res.body.logs)).toBe(true)
    expect(res.body.customer).toBeDefined()
    expect(res.body.customer.companyName).toBe(SEEDS.customer.companyName)
  })

  // ── 5. POST missing responsiblePersonId → 400 ────────────────────────
  it('POST /inspections → 400 when responsiblePersonId is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: SEEDS.customer.id,
        frequency: 'MONTHLY',
        powerEquipment: '开关柜',
        contactPerson: '测试员',
        contactInfo: '13900000001',
      })
      .expect(400)
  })

  // ── 6. STAFF can create inspection ───────────────────────────────────
  it('POST /inspections → 201 by STAFF', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/inspections')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        customerId: SEEDS.customer.id,
        responsiblePersonId: SEEDS.staff.id,
        frequency: 'MONTHLY',
        powerEquipment: '10kV开关柜',
        contactPerson: '职员联系人',
        contactInfo: '13900000002',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.responsiblePerson.id).toBe(SEEDS.staff.id)
  })

  // ── 7. ADMIN can create inspection and stores id ──────────────────────
  it('POST /inspections → 201 by ADMIN, stores createdId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: SEEDS.customer.id,
        responsiblePersonId: SEEDS.dept.id,
        frequency: 'QUARTERLY',
        powerEquipment: '110kV变压器',
        contactPerson: '管理联系人',
        contactInfo: '13900000003',
        safetyTools: '绝缘手套',
      })
      .expect(201)
    createdId = res.body.id
    expect(createdId).toBeDefined()
  })

  // ── 8. STAFF can update inspection ───────────────────────────────────
  it('PUT /inspections/:id → 200 by STAFF, fields updated', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ contactPerson: '职员已更新' })
      .expect(200)
    expect(res.body.contactPerson).toBe('职员已更新')
  })

  // ── 9. DEPT_MANAGER can update inspection ────────────────────────────
  it('PUT /inspections/:id → 200 by DEPT_MANAGER, powerEquipment updated', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${deptToken}`)
      .send({ powerEquipment: '部门负责人已修改设备' })
      .expect(200)
    expect(res.body.powerEquipment).toBe('部门负责人已修改设备')
  })

  // ── 10. STAFF cannot delete → 403 ────────────────────────────────────
  it('DELETE /inspections/:id → 403 for STAFF', async () => {
    await request(app.getHttpServer())
      .delete(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403)
  })

  // ── 11. ADMIN soft-delete succeeds ───────────────────────────────────
  it('DELETE /inspections/:id → 200 soft-delete by ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/inspections/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.message).toBe('删除成功')
  })

  // ── 12. Soft-deleted record not in list ──────────────────────────────
  it('GET /inspections → soft-deleted record not in items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    const ids = res.body.items.map((i: any) => i.id)
    expect(ids).not.toContain(createdId)
  })

  // ── 13. GET /inspections/:id → logs contain create + update entries ──
  it('GET /inspections/:id → logs array contains at least 1 entry', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/inspections/${SEEDS.inspection.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
    expect(Array.isArray(res.body.logs)).toBe(true)
  })
})
