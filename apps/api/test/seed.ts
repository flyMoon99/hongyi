import { PrismaClient, UserRole, Gender } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export const SEEDS = {
  admin: {
    id: 'test-admin-001',
    phone: '19900000001',
    role: 'ADMIN' as UserRole,
    name: '测试管理员',
    password: 'Admin@123456',
  },
  dept: {
    id: 'test-dept-001',
    phone: '19900000002',
    role: 'DEPT_MANAGER' as UserRole,
    name: '测试部门负责人',
    password: 'Dept@123456',
  },
  staff: {
    id: 'test-staff-001',
    phone: '19900000003',
    role: 'STAFF' as UserRole,
    name: '测试职员',
    password: 'Staff@123456',
  },
}

export async function buildSeed(prisma: PrismaClient): Promise<void> {
  // Clean in dependency order
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
        isDeleted: false,
      },
      {
        id: SEEDS.dept.id,
        name: SEEDS.dept.name,
        phone: SEEDS.dept.phone,
        password: await hash(SEEDS.dept.password),
        role: SEEDS.dept.role,
        gender: 'MALE' as Gender,
        isDeleted: false,
      },
      {
        id: SEEDS.staff.id,
        name: SEEDS.staff.name,
        phone: SEEDS.staff.phone,
        password: await hash(SEEDS.staff.password),
        role: SEEDS.staff.role,
        gender: 'FEMALE' as Gender,
        isDeleted: false,
      },
    ],
  })
}
