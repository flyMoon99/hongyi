import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateInspectionDto } from './dto/create-inspection.dto'
import { UpdateInspectionDto } from './dto/update-inspection.dto'

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, customerId?: string, search?: string) {
    const where: any = {}
    if (customerId) where.customerId = customerId
    if (search) where.OR = [
      { powerEquipment: { contains: search } },
      { customer: { companyName: { contains: search } } },
    ]
    const [items, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, companyName: true } } },
      }),
      this.prisma.inspection.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const item = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, companyName: true } },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { operator: { select: { id: true, name: true } } },
        },
      },
    })
    if (!item) throw new NotFoundException('巡检记录不存在')
    return item
  }

  async create(dto: CreateInspectionDto, operatorId: string) {
    const item = await this.prisma.inspection.create({
      data: {
        ...dto,
        lastInspectionDate: dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : undefined,
        nextInspectionDate: dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : undefined,
      },
    })
    await this.prisma.inspectionLog.create({
      data: { inspectionId: item.id, action: '创建巡检', detail: `创建巡检记录`, operatorId },
    })
    return item
  }

  async update(id: string, dto: UpdateInspectionDto, operatorId: string) {
    await this.findOne(id)
    const item = await this.prisma.inspection.update({
      where: { id },
      data: {
        ...dto,
        lastInspectionDate: dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : undefined,
        nextInspectionDate: dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : undefined,
      },
    })
    await this.prisma.inspectionLog.create({
      data: { inspectionId: id, action: '更新巡检', detail: `更新巡检记录`, operatorId },
    })
    return item
  }

  async remove(id: string, operatorId: string) {
    await this.findOne(id)
    await this.prisma.inspectionLog.create({
      data: { inspectionId: id, action: '删除巡检', detail: `删除巡检记录`, operatorId },
    })
    await this.prisma.inspection.delete({ where: { id } })
    return { message: '删除成功' }
  }
}
