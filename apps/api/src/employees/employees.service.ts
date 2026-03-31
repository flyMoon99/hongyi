import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee.dto'

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, search?: string) {
    const where = search
      ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }] }
      : {}
    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, gender: true, phone: true,
          avatar: true, email: true, isAdmin: true, createdAt: true, updatedAt: true,
        },
      }),
      this.prisma.employee.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true, name: true, gender: true, phone: true,
        avatar: true, email: true, isAdmin: true, createdAt: true, updatedAt: true,
      },
    })
    if (!employee) throw new NotFoundException('员工不存在')
    return employee
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { phone: dto.phone } })
    if (existing) throw new ConflictException('手机号已存在')
    const hashed = await bcrypt.hash(dto.password, 10)
    return this.prisma.employee.create({
      data: { ...dto, password: hashed },
      select: {
        id: true, name: true, gender: true, phone: true,
        avatar: true, email: true, isAdmin: true, createdAt: true, updatedAt: true,
      },
    })
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id)
    if (dto.phone) {
      const existing = await this.prisma.employee.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      })
      if (existing) throw new ConflictException('手机号已存在')
    }
    const data: any = { ...dto }
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10)
    return this.prisma.employee.update({
      where: { id },
      data,
      select: {
        id: true, name: true, gender: true, phone: true,
        avatar: true, email: true, isAdmin: true, createdAt: true, updatedAt: true,
      },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.employee.delete({ where: { id } })
    return { message: '删除成功' }
  }
}
