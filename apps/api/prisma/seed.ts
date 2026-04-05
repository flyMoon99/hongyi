import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Admin@123456', 10)

  const admin = await prisma.employee.upsert({
    where: { phone: '13800138001' },
    update: {},
    create: {
      name: '高高',
      gender: 'MALE',
      phone: '13800138001',
      password: hash,
      email: 'zhangwei@holdingpower.cn',
      role: 'ADMIN',
    },
  })

  console.log('Seeded admin:', admin.name, admin.phone)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
