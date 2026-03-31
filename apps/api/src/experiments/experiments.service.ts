import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateExperimentDto } from './dto/create-experiment.dto'
import { UpdateExperimentDto } from './dto/update-experiment.dto'

@Injectable()
export class ExperimentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, customerId?: string, search?: string) {
    const where: any = {}
    if (customerId) where.customerId = customerId
    if (search) where.OR = [
      { powerEquipment: { contains: search } },
      { customer: { companyName: { contains: search } } },
    ]
    const [items, total] = await Promise.all([
      this.prisma.experiment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, companyName: true } } },
      }),
      this.prisma.experiment.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const item = await this.prisma.experiment.findUnique({
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
    if (!item) throw new NotFoundException('试验记录不存在')
    return item
  }

  async create(dto: CreateExperimentDto, operatorId: string) {
    const item = await this.prisma.experiment.create({
      data: {
        ...dto,
        lastTestDate: dto.lastTestDate ? new Date(dto.lastTestDate) : undefined,
        nextTestDate: dto.nextTestDate ? new Date(dto.nextTestDate) : undefined,
      },
    })
    await this.prisma.experimentLog.create({
      data: { experimentId: item.id, action: '创建试验', detail: `创建试验记录`, operatorId },
    })
    return item
  }

  async update(id: string, dto: UpdateExperimentDto, operatorId: string) {
    await this.findOne(id)
    const item = await this.prisma.experiment.update({
      where: { id },
      data: {
        ...dto,
        lastTestDate: dto.lastTestDate ? new Date(dto.lastTestDate) : undefined,
        nextTestDate: dto.nextTestDate ? new Date(dto.nextTestDate) : undefined,
      },
    })
    await this.prisma.experimentLog.create({
      data: { experimentId: id, action: '更新试验', detail: `更新试验记录`, operatorId },
    })
    return item
  }

  async remove(id: string, operatorId: string) {
    await this.findOne(id)
    await this.prisma.experimentLog.create({
      data: { experimentId: id, action: '删除试验', detail: `删除试验记录`, operatorId },
    })
    await this.prisma.experiment.delete({ where: { id } })
    return { message: '删除成功' }
  }
}
