import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, search?: string) {
    const where = search
      ? { OR: [{ companyName: { contains: search } }, { contactPerson: { contains: search } }] }
      : {}
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        inspections: { orderBy: { lastInspectionDate: 'desc' }, take: 5 },
        experiments: { orderBy: { lastTestDate: 'desc' }, take: 5 },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { operator: { select: { id: true, name: true } } },
        },
      },
    })
    if (!customer) throw new NotFoundException('客户不存在')
    return customer
  }

  async create(dto: CreateCustomerDto, operatorId: string) {
    const customer = await this.prisma.customer.create({
      data: {
        ...dto,
        lastPatrolTime: dto.lastPatrolTime ? new Date(dto.lastPatrolTime) : undefined,
      },
    })
    await this.prisma.customerLog.create({
      data: { customerId: customer.id, action: '创建客户', detail: `创建客户：${customer.companyName}`, operatorId },
    })
    return customer
  }

  async update(id: string, dto: UpdateCustomerDto, operatorId: string) {
    await this.findOne(id)
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        lastPatrolTime: dto.lastPatrolTime ? new Date(dto.lastPatrolTime) : undefined,
      },
    })
    await this.prisma.customerLog.create({
      data: { customerId: id, action: '更新客户', detail: `更新客户信息`, operatorId },
    })
    return customer
  }

  async remove(id: string, operatorId: string) {
    const customer = await this.findOne(id)
    await this.prisma.customerLog.create({
      data: { customerId: id, action: '删除客户', detail: `删除客户：${customer.companyName}`, operatorId },
    })
    await this.prisma.customer.delete({ where: { id } })
    return { message: '删除成功' }
  }

  async getLogs(customerId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.customerLog.findMany({
        where: { customerId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { operator: { select: { id: true, name: true } } },
      }),
      this.prisma.customerLog.count({ where: { customerId } }),
    ])
    return { items, total, page, pageSize }
  }
}
