import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { buildSeed, SEEDS } from './seed'

const prisma = new PrismaClient()

describe('Fire Inspections API (e2e)', () => {
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
  it('GET /fire-inspections → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/fire-inspections').expect(401)
  })

  // ── 2. ADMIN → 403 ──────────────────────────────────────────────────
  it('GET /fire-inspections → 403 for ADMIN', async () => {
    await request(app.getHttpServer())
      .get('/api/fire-inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  // ── 3. HAODING DEPT_MANAGER → GET/POST → 403 ────────────────────────
  it('GET /fire-inspections → 403 for HAODING DEPT_MANAGER', async () => {
    await request(app.getHttpServer())
      .get('/api/fire-inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(403)
  })

  it('POST /fire-inspections → 403 for HAODING DEPT_MANAGER', async () => {
    await request(app.getHttpServer())
      .post('/api/fire-inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({
        stationRoomId: SEEDS.stationRoom.id,
        frequency: 'ANNUALLY',
        responsiblePerson: '越权人',
        equipment: ['FIRE_EXTINGUISHER'],
        contactPerson: '越权联系人',
        contactInfo: '13000000001',
      })
      .expect(403)
  })

  // ── 4. STATE_GRID STAFF 可以读取列表 ────────────────────────────────
  it('GET /fire-inspections → 200 + items array for STATE_GRID STAFF', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/fire-inspections')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .expect(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  // ── 5. STATE_GRID STAFF 无法新增 → 403 ──────────────────────────────
  it('POST /fire-inspections → 403 for STATE_GRID STAFF', async () => {
    await request(app.getHttpServer())
      .post('/api/fire-inspections')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .send({
        stationRoomId: SEEDS.stationRoom.id,
        frequency: 'ANNUALLY',
        responsiblePerson: '越权人',
        equipment: ['FIRE_EXTINGUISHER'],
        contactPerson: '越权联系人',
        contactInfo: '13000000001',
      })
      .expect(403)
  })

  // ── 6. STATE_GRID DEPT_MANAGER 新增消防巡检 → 201 + equipment 数组 ──
  it('POST /fire-inspections → 201 by STATE_GRID DEPT_MANAGER, equipment array correct', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/fire-inspections')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .send({
        stationRoomId: SEEDS.stationRoom.id,
        frequency: 'ANNUALLY',
        responsiblePerson: '消防负责人张工',
        equipment: ['GAS_SUPPRESSION', 'FIRE_EXTINGUISHER'],
        contactPerson: '巡检联系人',
        contactInfo: '13800009999',
        remark: '年度消防巡检',
        lastInspectionDate: '2025-01-01',
        nextInspectionDate: '2026-01-01',
      })
      .expect(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.company).toBe('STATE_GRID')
    expect(Array.isArray(res.body.equipment)).toBe(true)
    expect(res.body.equipment).toContain('GAS_SUPPRESSION')
    expect(res.body.equipment).toContain('FIRE_EXTINGUISHER')
    expect(res.body.stationRoom).toBeDefined()
    expect(res.body.stationRoom.id).toBe(SEEDS.stationRoom.id)
    createdId = res.body.id
  })

  // ── 7. 站室下拉筛选（stationRoomId）────────────────────────────────
  it('GET /fire-inspections?stationRoomId=... → returns matching records', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/fire-inspections?stationRoomId=${SEEDS.stationRoom.id}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
    for (const item of res.body.items) {
      expect(item.stationRoom.id).toBe(SEEDS.stationRoom.id)
    }
  })

  // ── 8. 搜索参数生效（按负责人姓名）──────────────────────────────────
  it('GET /fire-inspections?search=张工 → returns matching record', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/fire-inspections?search=张工')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body.total).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].responsiblePerson).toContain('张工')
  })

  // ── 9. GET 详情 → 200 + logs 数组 + stationRoom ──────────────────────
  it('GET /fire-inspections/:id → 200 + logs + stationRoom', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/fire-inspections/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body.id).toBe(createdId)
    expect(Array.isArray(res.body.logs)).toBe(true)
    expect(res.body.logs.length).toBeGreaterThanOrEqual(1)
    expect(res.body.logs[0].action).toBe('新增消防巡检')
    expect(res.body.stationRoom).toBeDefined()
  })

  // ── 10. PUT 修改 → 200 ──────────────────────────────────────────────
  it('PUT /fire-inspections/:id → 200 by STATE_GRID DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/fire-inspections/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .send({
        responsiblePerson: '已修改负责人',
        remark: '已更新备注',
        equipment: ['FIRE_EXTINGUISHER'],
      })
      .expect(200)
    expect(res.body.responsiblePerson).toBe('已修改负责人')
    expect(res.body.remark).toBe('已更新备注')
    expect(res.body.equipment).toEqual(['FIRE_EXTINGUISHER'])
  })

  // ── 11. STATE_GRID STAFF 无法修改 → 403 ─────────────────────────────
  it('PUT /fire-inspections/:id → 403 for STATE_GRID STAFF', async () => {
    await request(app.getHttpServer())
      .put(`/api/fire-inspections/${createdId}`)
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .send({ remark: '越权修改' })
      .expect(403)
  })

  // ── 12. DELETE 软删除 → 200 ─────────────────────────────────────────
  it('DELETE /fire-inspections/:id → 200 soft-delete by STATE_GRID DEPT_MANAGER', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/fire-inspections/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    expect(res.body.message).toBe('删除成功')
  })

  // ── 13. 软删除后不出现在列表中 ─────────────────────────────────────
  it('GET /fire-inspections → soft-deleted record not in items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/fire-inspections')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(200)
    const ids = res.body.items.map((i: any) => i.id)
    expect(ids).not.toContain(createdId)
  })

  // ── 14. 软删除后 GET 详情 → 404 ──────────────────────────────────────
  it('GET /fire-inspections/:id → 404 for soft-deleted record', async () => {
    await request(app.getHttpServer())
      .get(`/api/fire-inspections/${createdId}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(404)
  })
})
