import {
  PrismaClient,
  UserRole,
  Gender,
  Company,
  InspectionFrequency,
  ExperimentFrequency,
} from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export const SEEDS = {
  admin: {
    id: 'test-admin-001',
    phone: '19900000001',
    role: 'ADMIN' as UserRole,
    name: '测试管理员',
    password: 'Admin@123456',
    company: null as Company | null,
  },
  /** 皓鼎弘毅部门负责人 */
  hdDept: {
    id: 'test-hd-dept-001',
    phone: '19900000002',
    role: 'DEPT_MANAGER' as UserRole,
    name: '皓鼎部门负责人',
    password: 'Dept@123456',
    company: 'HAODING_HONGYI' as Company,
  },
  /** 皓鼎弘毅职员 */
  hdStaff: {
    id: 'test-hd-staff-001',
    phone: '19900000003',
    role: 'STAFF' as UserRole,
    name: '皓鼎职员',
    password: 'Staff@123456',
    company: 'HAODING_HONGYI' as Company,
  },
  /** 国家电网部门负责人 */
  gridDept: {
    id: 'test-grid-dept-001',
    phone: '19900000004',
    role: 'DEPT_MANAGER' as UserRole,
    name: '电网部门负责人',
    password: 'GridDept@123',
    company: 'STATE_GRID' as Company,
  },
  /** 国家电网职员 */
  gridStaff: {
    id: 'test-grid-staff-001',
    phone: '19900000005',
    role: 'STAFF' as UserRole,
    name: '电网职员',
    password: 'GridStaff@123',
    company: 'STATE_GRID' as Company,
  },
  customer: {
    id: 'test-customer-001',
    companyName: '测试电力公司',
    contactPerson: '张三',
    contactInfo: '13011110001',
    company: 'HAODING_HONGYI' as Company,
  },
  inspection: {
    id: 'test-inspection-001',
    frequency: 'QUARTERLY' as InspectionFrequency,
    powerEquipment: '110kV主变压器、GIS设备',
    contactPerson: '李工',
    contactInfo: '13800001111',
    safetyTools: '绝缘手套、验电器',
    company: 'HAODING_HONGYI' as Company,
  },
  experiment: {
    id: 'test-experiment-001',
    frequency: 'QUARTERLY' as ExperimentFrequency,
    powerEquipment: '主变压器绕组绝缘电阻测试',
    contactPerson: '王工',
    contactInfo: '13800002222',
    safetyTools: '兆欧表、高压绝缘测试仪',
    company: 'HAODING_HONGYI' as Company,
  },
  stationRoom: {
    id: 'test-station-room-001',
    name: '测试1号站室',
    remark: '测试站室备注',
    contactPerson: '郑工',
    contactInfo: '13800003333',
    company: 'STATE_GRID' as Company,
  },
  // Backward-compat aliases
  get dept() { return this.hdDept },
  get staff() { return this.hdStaff },
}

export async function buildSeed(prisma: PrismaClient): Promise<void> {
  // Clean in reverse dependency order
  await prisma.fireInspectionLog.deleteMany()
  await prisma.fireInspection.deleteMany()
  await prisma.stationRoomLog.deleteMany()
  await prisma.stationRoom.deleteMany()
  await prisma.experimentLog.deleteMany()
  await prisma.experiment.deleteMany()
  await prisma.inspectionLog.deleteMany()
  await prisma.inspection.deleteMany()
  await prisma.customerLog.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.employeeLog.deleteMany()
  await prisma.employee.deleteMany()

  const hash = (pw: string) => bcrypt.hash(pw, 10)

  await prisma.employee.createMany({
    data: [
      {
        id: SEEDS.admin.id,
        name: SEEDS.admin.name,
        phone: SEEDS.admin.phone,
        password: await hash(SEEDS.admin.password),
        role: SEEDS.admin.role,
        gender: 'MALE' as Gender,
        company: null,
        isDeleted: false,
      },
      {
        id: SEEDS.hdDept.id,
        name: SEEDS.hdDept.name,
        phone: SEEDS.hdDept.phone,
        password: await hash(SEEDS.hdDept.password),
        role: SEEDS.hdDept.role,
        gender: 'MALE' as Gender,
        company: SEEDS.hdDept.company,
        isDeleted: false,
      },
      {
        id: SEEDS.hdStaff.id,
        name: SEEDS.hdStaff.name,
        phone: SEEDS.hdStaff.phone,
        password: await hash(SEEDS.hdStaff.password),
        role: SEEDS.hdStaff.role,
        gender: 'FEMALE' as Gender,
        company: SEEDS.hdStaff.company,
        isDeleted: false,
      },
      {
        id: SEEDS.gridDept.id,
        name: SEEDS.gridDept.name,
        phone: SEEDS.gridDept.phone,
        password: await hash(SEEDS.gridDept.password),
        role: SEEDS.gridDept.role,
        gender: 'MALE' as Gender,
        company: SEEDS.gridDept.company,
        isDeleted: false,
      },
      {
        id: SEEDS.gridStaff.id,
        name: SEEDS.gridStaff.name,
        phone: SEEDS.gridStaff.phone,
        password: await hash(SEEDS.gridStaff.password),
        role: SEEDS.gridStaff.role,
        gender: 'FEMALE' as Gender,
        company: SEEDS.gridStaff.company,
        isDeleted: false,
      },
    ],
  })

  await prisma.customer.create({
    data: {
      id: SEEDS.customer.id,
      companyName: SEEDS.customer.companyName,
      contactPerson: SEEDS.customer.contactPerson,
      contactInfo: SEEDS.customer.contactInfo,
      company: SEEDS.customer.company,
      isDeleted: false,
    },
  })

  await prisma.inspection.create({
    data: {
      id: SEEDS.inspection.id,
      customerId: SEEDS.customer.id,
      responsiblePersonId: SEEDS.hdStaff.id,
      frequency: SEEDS.inspection.frequency,
      powerEquipment: SEEDS.inspection.powerEquipment,
      contactPerson: SEEDS.inspection.contactPerson,
      contactInfo: SEEDS.inspection.contactInfo,
      safetyTools: SEEDS.inspection.safetyTools,
      company: SEEDS.inspection.company,
      isDeleted: false,
    },
  })

  await prisma.experiment.create({
    data: {
      id: SEEDS.experiment.id,
      customerId: SEEDS.customer.id,
      responsiblePersonId: SEEDS.hdStaff.id,
      frequency: SEEDS.experiment.frequency,
      powerEquipment: SEEDS.experiment.powerEquipment,
      contactPerson: SEEDS.experiment.contactPerson,
      contactInfo: SEEDS.experiment.contactInfo,
      safetyTools: SEEDS.experiment.safetyTools,
      company: SEEDS.experiment.company,
      isDeleted: false,
    },
  })

  await prisma.stationRoom.create({
    data: {
      id: SEEDS.stationRoom.id,
      name: SEEDS.stationRoom.name,
      remark: SEEDS.stationRoom.remark,
      contactPerson: SEEDS.stationRoom.contactPerson,
      contactInfo: SEEDS.stationRoom.contactInfo,
      company: SEEDS.stationRoom.company,
      isDeleted: false,
    },
  })
}
