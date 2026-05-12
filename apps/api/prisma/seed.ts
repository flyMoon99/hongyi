import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('Admin@123456', 10)
  const managerHash = await bcrypt.hash('Manager@123', 10)
  const staffHash = await bcrypt.hash('Staff@123456', 10)

  // 超级管理员（无公司，仅员工管理）
  const admin = await prisma.employee.upsert({
    where: { phone: '13800138001' },
    update: {},
    create: {
      name: '超级管理员',
      gender: 'MALE',
      phone: '13800138001',
      password: adminHash,
      email: 'admin@holdingpower.cn',
      role: 'ADMIN',
      company: null,
    },
  })

  // 皓鼎弘毅 - 部门负责人
  const hdManager = await prisma.employee.upsert({
    where: { phone: '13800138002' },
    update: {},
    create: {
      name: '皓鼎负责人',
      gender: 'MALE',
      phone: '13800138002',
      password: managerHash,
      role: 'DEPT_MANAGER',
      company: 'HAODING_HONGYI',
    },
  })

  // 皓鼎弘毅 - 职员
  const hdStaff = await prisma.employee.upsert({
    where: { phone: '13800138003' },
    update: {},
    create: {
      name: '皓鼎职员',
      gender: 'FEMALE',
      phone: '13800138003',
      password: staffHash,
      role: 'STAFF',
      company: 'HAODING_HONGYI',
    },
  })

  // 国家电网 - 部门负责人
  const sgManager = await prisma.employee.upsert({
    where: { phone: '13800138004' },
    update: {},
    create: {
      name: '电网负责人',
      gender: 'MALE',
      phone: '13800138004',
      password: managerHash,
      role: 'DEPT_MANAGER',
      company: 'STATE_GRID',
    },
  })

  // 国家电网 - 职员
  const sgStaff = await prisma.employee.upsert({
    where: { phone: '13800138005' },
    update: {},
    create: {
      name: '电网职员',
      gender: 'FEMALE',
      phone: '13800138005',
      password: staffHash,
      role: 'STAFF',
      company: 'STATE_GRID',
    },
  })

  // 站室示例数据（国家电网）
  const stationRoom = await prisma.stationRoom.upsert({
    where: { id: 'seed-station-room-1' },
    update: {},
    create: {
      id: 'seed-station-room-1',
      name: '1号变电站',
      remark: '主变压器站室',
      contactPerson: '张工',
      contactInfo: '13900139001',
      company: 'STATE_GRID',
    },
  })

  console.log('Seeded employees:')
  console.log(' ADMIN        13800138001 / Admin@123456')
  console.log(' 皓鼎 MANAGER  13800138002 / Manager@123')
  console.log(' 皓鼎 STAFF    13800138003 / Staff@123456')
  console.log(' 电网 MANAGER  13800138004 / Manager@123')
  console.log(' 电网 STAFF    13800138005 / Staff@123456')
  console.log('Seeded station room:', stationRoom.name)
  console.log('Done.')
  void hdManager, hdStaff, sgManager, sgStaff, admin
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
