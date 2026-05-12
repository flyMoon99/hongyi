/**
 * 公司隔离 E2E 测试（跨公司权限矩阵负向测试）
 *
 * 专门覆盖各角色 × 公司组合对各模块的访问限制：
 * 所有测试均为"负向"（期望 403），或验证数据确实被公司过滤隔离。
 */
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { buildSeed, SEEDS } from './seed'

const prisma = new PrismaClient()

describe('Company Isolation (e2e)', () => {
  let app: INestApplication
  let adminToken: string
  let hdDeptToken: string
  let hdStaffToken: string
  let gridDeptToken: string
  let gridStaffToken: string

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

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN 仅允许员工模块，访问其余所有业务模块均应返回 403
  // ═══════════════════════════════════════════════════════════════════

  it('ADMIN | GET /customers → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  it('ADMIN | GET /inspections → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  it('ADMIN | GET /experiments → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/experiments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  it('ADMIN | GET /station-rooms → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/station-rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  it('ADMIN | GET /fire-inspections → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/fire-inspections')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  it('ADMIN | POST /customers → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyName: '管理员创建', contactPerson: 'x', contactInfo: '13000000000' })
      .expect(403)
  })

  // ═══════════════════════════════════════════════════════════════════
  // 皓鼎负责人不能访问 STATE_GRID 专属模块
  // ═══════════════════════════════════════════════════════════════════

  it('HAODING DEPT_MANAGER | GET /station-rooms → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/station-rooms')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(403)
  })

  it('HAODING DEPT_MANAGER | POST /station-rooms → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/station-rooms')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({ name: '越权站室', contactPerson: 'x', contactInfo: '13000000000' })
      .expect(403)
  })

  it('HAODING DEPT_MANAGER | GET /fire-inspections → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/fire-inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(403)
  })

  it('HAODING DEPT_MANAGER | POST /fire-inspections → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/fire-inspections')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({
        stationRoomId: SEEDS.stationRoom.id,
        frequency: 'ANNUALLY',
        responsiblePerson: '越权',
        equipment: [],
        contactPerson: 'x',
        contactInfo: '13000000000',
      })
      .expect(403)
  })

  // ═══════════════════════════════════════════════════════════════════
  // 皓鼎职员只能读皓鼎模块，不能写任何内容
  // ═══════════════════════════════════════════════════════════════════

  it('HAODING STAFF | POST /customers → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .send({ companyName: '职员创建', contactPerson: 'y', contactInfo: '13000000001' })
      .expect(403)
  })

  it('HAODING STAFF | PUT /customers/:id → 403', async () => {
    await request(app.getHttpServer())
      .put(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .send({ companyName: '越权修改' })
      .expect(403)
  })

  it('HAODING STAFF | DELETE /customers/:id → 403', async () => {
    await request(app.getHttpServer())
      .delete(`/api/customers/${SEEDS.customer.id}`)
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(403)
  })

  it('HAODING STAFF | GET /station-rooms → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/station-rooms')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(403)
  })

  it('HAODING STAFF | GET /fire-inspections → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/fire-inspections')
      .set('Authorization', `Bearer ${hdStaffToken}`)
      .expect(403)
  })

  // ═══════════════════════════════════════════════════════════════════
  // 国网负责人不能访问 HAODING 专属模块
  // ═══════════════════════════════════════════════════════════════════

  it('STATE_GRID DEPT_MANAGER | GET /customers → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(403)
  })

  it('STATE_GRID DEPT_MANAGER | POST /customers → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .send({ companyName: '越权客户', contactPerson: 'z', contactInfo: '13000000002' })
      .expect(403)
  })

  it('STATE_GRID DEPT_MANAGER | GET /inspections → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(403)
  })

  it('STATE_GRID DEPT_MANAGER | GET /experiments → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/experiments')
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .expect(403)
  })

  // ═══════════════════════════════════════════════════════════════════
  // 国网职员只能读国网模块，不能写
  // ═══════════════════════════════════════════════════════════════════

  it('STATE_GRID STAFF | POST /station-rooms → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/station-rooms')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .send({ name: '越权站室', contactPerson: 'z', contactInfo: '13000000003' })
      .expect(403)
  })

  it('STATE_GRID STAFF | DELETE /station-rooms/:id → 403', async () => {
    await request(app.getHttpServer())
      .delete(`/api/station-rooms/${SEEDS.stationRoom.id}`)
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .expect(403)
  })

  it('STATE_GRID STAFF | POST /fire-inspections → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/fire-inspections')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .send({
        stationRoomId: SEEDS.stationRoom.id,
        frequency: 'QUARTERLY',
        responsiblePerson: '越权',
        equipment: ['FIRE_EXTINGUISHER'],
        contactPerson: 'z',
        contactInfo: '13000000003',
      })
      .expect(403)
  })

  it('STATE_GRID STAFF | GET /customers → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .expect(403)
  })

  it('STATE_GRID STAFF | GET /inspections → 403', async () => {
    await request(app.getHttpServer())
      .get('/api/inspections')
      .set('Authorization', `Bearer ${gridStaffToken}`)
      .expect(403)
  })

  // ═══════════════════════════════════════════════════════════════════
  // 公司数据隔离：HAODING DEPT_MANAGER 创建员工，company 强制为 HAODING_HONGYI
  // ═══════════════════════════════════════════════════════════════════

  it('HAODING DEPT_MANAGER POST /employees with STATE_GRID company → company forced to HAODING_HONGYI', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/employees')
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({
        name: '隔离测试员工',
        gender: 'MALE',
        phone: '19900009901',
        password: 'Test@12345',
        company: 'STATE_GRID',  // 尝试越权
      })
      .expect(201)
    expect(res.body.company).toBe('HAODING_HONGYI')

    // 清理
    await prisma.employee.update({
      where: { id: res.body.id },
      data: { isDeleted: true },
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 皓鼎负责人不能跨公司管理国网员工
  // ═══════════════════════════════════════════════════════════════════

  it('HAODING DEPT_MANAGER | PUT /employees/:gridStaffId → 403 (cross-company)', async () => {
    await request(app.getHttpServer())
      .put(`/api/employees/${SEEDS.gridStaff.id}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .send({ name: '越权修改国网员工' })
      .expect(403)
  })

  it('HAODING DEPT_MANAGER | DELETE /employees/:gridStaffId → 403 (cross-company)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/employees/${SEEDS.gridStaff.id}`)
      .set('Authorization', `Bearer ${hdDeptToken}`)
      .expect(403)
  })

  // ═══════════════════════════════════════════════════════════════════
  // 国网负责人不能跨公司管理皓鼎员工
  // ═══════════════════════════════════════════════════════════════════

  it('STATE_GRID DEPT_MANAGER | PUT /employees/:hdStaffId → 403 (cross-company)', async () => {
    await request(app.getHttpServer())
      .put(`/api/employees/${SEEDS.hdStaff.id}`)
      .set('Authorization', `Bearer ${gridDeptToken}`)
      .send({ name: '越权修改皓鼎员工' })
      .expect(403)
  })
})
