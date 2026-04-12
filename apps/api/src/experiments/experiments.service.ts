import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateExperimentDto } from './dto/create-experiment.dto'
import { UpdateExperimentDto } from './dto/update-experiment.dto'
import { UserRole } from '@prisma/client'

const RESPONSIBLE_SELECT = { id: true, name: true }

@Injectable()
export class ExperimentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, customerId?: string, search?: string) {
    const where: any = { isDeleted: false }
    if (customerId) where.customerId = customerId
    if (search) {
      where.OR = [
        { customer: { companyName: { contains: search } } },
        { responsiblePerson: { name: { contains: search } } },
      ]
    }
    const [items, total] = await Promise.all([
      this.prisma.experiment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, companyName: true } },
          responsiblePerson: { select: RESPONSIBLE_SELECT },
        },
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
        responsiblePerson: { select: RESPONSIBLE_SELECT },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            operator: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!item || item.isDeleted) throw new NotFoundException('试验记录不存在')
    return item
  }

  async create(dto: CreateExperimentDto, operatorId: string) {
    const item = await this.prisma.experiment.create({
      data: {
        customerId: dto.customerId,
        responsiblePersonId: dto.responsiblePersonId,
        frequency: dto.frequency,
        powerEquipment: dto.powerEquipment,
        safetyTools: dto.safetyTools,
        contactPerson: dto.contactPerson,
        contactInfo: dto.contactInfo,
        lastTestDate: dto.lastTestDate ? new Date(dto.lastTestDate) : undefined,
        nextTestDate: dto.nextTestDate ? new Date(dto.nextTestDate) : undefined,
      },
      include: {
        customer: { select: { id: true, companyName: true } },
        responsiblePerson: { select: RESPONSIBLE_SELECT },
      },
    })
    await this.prisma.experimentLog.create({
      data: {
        experimentId: item.id,
        action: '创建试验',
        detail: `创建试验记录：${item.customer.companyName} - ${item.powerEquipment}`,
        operatorId,
      },
    })
    return item
  }

  async update(id: string, dto: UpdateExperimentDto, operatorId: string) {
    await this.findOne(id)
    const data: any = { ...dto }
    if (dto.lastTestDate !== undefined) {
      data.lastTestDate = dto.lastTestDate ? new Date(dto.lastTestDate) : null
    }
    if (dto.nextTestDate !== undefined) {
      data.nextTestDate = dto.nextTestDate ? new Date(dto.nextTestDate) : null
    }
    const item = await this.prisma.experiment.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, companyName: true } },
        responsiblePerson: { select: RESPONSIBLE_SELECT },
      },
    })
    await this.prisma.experimentLog.create({
      data: {
        experimentId: id,
        action: '更新试验',
        detail: `更新试验记录：${item.customer.companyName} - ${item.powerEquipment}`,
        operatorId,
      },
    })
    return item
  }

  async remove(id: string, operatorId: string, operatorRole: UserRole) {
    if (operatorRole !== 'ADMIN' && operatorRole !== 'DEPT_MANAGER') {
      throw new ForbiddenException('需要管理员或部门负责人权限')
    }
    const existing = await this.prisma.experiment.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) throw new NotFoundException('试验记录不存在')

    await this.prisma.experimentLog.create({
      data: {
        experimentId: id,
        action: '删除试验',
        detail: `删除试验记录（软删除）`,
        operatorId,
      },
    })
    await this.prisma.experiment.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    return { message: '删除成功' }
  }
}
