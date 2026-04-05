import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { buildSeed, SEEDS } from './seed'

const prisma = new PrismaClient()

describe('Auth API (e2e)', () => {
  let app: INestApplication
  let adminToken: string
  let staffToken: string

  beforeAll(async () => {
    await buildSeed(prisma)

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.setGlobalPrefix('api')
    await app.init()

    // Pre-obtain tokens for subsequent tests
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: SEEDS.admin.phone, password: SEEDS.admin.password })
    adminToken = adminLogin.body.accessToken

    const staffLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: SEEDS.staff.phone, password: SEEDS.staff.password })
    staffToken = staffLogin.body.accessToken
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  // ── 1. Successful login ──────────────────────────────────────────────
  it('POST /auth/login → 200 + accessToken when credentials correct', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: SEEDS.admin.phone, password: SEEDS.admin.password })
      .expect(201)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body.employee.role).toBe('ADMIN')
  })

  // ── 2. Wrong password → 401 + specific message ───────────────────────
  it('POST /auth/login → 401 + "密码错误" message when password wrong', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: SEEDS.admin.phone, password: 'WrongPass!' })
      .expect(401)
    expect(res.body.message).toBe('密码错误，请重新输入')
  })

  // ── 3. Non-existent phone → 401 + specific message ────────────────────
  it('POST /auth/login → 401 + "未注册" message when phone does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '19999999999', password: 'Any@Pass' })
      .expect(401)
    expect(res.body.message).toBe('该手机号未注册，请确认后重试')
  })

  // ── 4. GET /auth/me without token ────────────────────────────────────
  it('GET /auth/me → 401 when no token provided', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401)
  })

  // ── 5. GET /auth/me with ADMIN token ─────────────────────────────────
  it('GET /auth/me → 200 + role=ADMIN with valid admin token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(res.body.role).toBe('ADMIN')
    expect(res.body.id).toBe(SEEDS.admin.id)
    expect(res.body).not.toHaveProperty('password')
  })

  // ── 6. GET /auth/me with STAFF token also returns correct role ────────
  it('GET /auth/me → 200 + role=STAFF with valid staff token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
    expect(res.body.role).toBe('STAFF')
  })

  // ── 7. PUT /auth/me → updates name ───────────────────────────────────
  it('PUT /auth/me → 200 + updated name field', async () => {
    const newName = '管理员已改名'
    const res = await request(app.getHttpServer())
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: newName })
      .expect(200)
    expect(res.body.name).toBe(newName)
  })

  // ── 8. PUT /auth/me/password wrong current password ───────────────────
  it('PUT /auth/me/password → 401 when currentPassword is wrong', async () => {
    await request(app.getHttpServer())
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ currentPassword: 'WrongCurrent!', newPassword: 'NewPass@123' })
      .expect(401)
  })

  // ── 9. PUT /auth/me/password correct current password ────────────────
  it('PUT /auth/me/password → 200 when currentPassword is correct', async () => {
    await request(app.getHttpServer())
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ currentPassword: SEEDS.staff.password, newPassword: 'NewPass@123' })
      .expect(200)
  })
})
