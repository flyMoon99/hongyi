import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateInspectionDto } from './dto/create-inspection.dto'
import { UpdateInspectionDto } from './dto/update-inspection.dto'
import { UserRole } from '@prisma/client'

const RESPONSIBLE_SELECT = { id: true, name: true }

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, customerId?: string, search?: string) {
    const where: any = { isDeleted: false }
    if (customerId) where.customerId = customerId
    if (search) {
      where.OR = [
        { powerEquipment: { contains: search } },
        { customer: { companyName: { contains: search } } },
        { responsiblePerson: { name: { contains: search } } },
      ]
    }
    const [items, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, companyName: true } },
          responsiblePerson: { select: RESPONSIBLE_SELECT },
        },
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
    if (!item || item.isDeleted) throw new NotFoundException('巡检记录不存在')
    return item
  }

  async create(dto: CreateInspectionDto, operatorId: string) {
    const item = await this.prisma.inspection.create({
      data: {
        customerId: dto.customerId,
        responsiblePersonId: dto.responsiblePersonId,
        frequency: dto.frequency,
        powerEquipment: dto.powerEquipment,
        safetyTools: dto.safetyTools,
        contactPerson: dto.contactPerson,
        contactInfo: dto.contactInfo,
        lastInspectionDate: dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : undefined,
        nextInspectionDate: dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : undefined,
      },
      include: {
        customer: { select: { id: true, companyName: true } },
        responsiblePerson: { select: RESPONSIBLE_SELECT },
      },
    })
    await this.prisma.inspectionLog.create({
      data: {
        inspectionId: item.id,
        action: '创建巡检',
        detail: `创建巡检记录：${item.customer.companyName} - ${item.powerEquipment}`,
        operatorId,
      },
    })
    return item
  }

  async update(id: string, dto: UpdateInspectionDto, operatorId: string) {
    await this.findOne(id)
    const data: any = { ...dto }
    if (dto.lastInspectionDate !== undefined) {
      data.lastInspectionDate = dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : null
    }
    if (dto.nextInspectionDate !== undefined) {
      data.nextInspectionDate = dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : null
    }
    const item = await this.prisma.inspection.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, companyName: true } },
        responsiblePerson: { select: RESPONSIBLE_SELECT },
      },
    })
    await this.prisma.inspectionLog.create({
      data: {
        inspectionId: id,
        action: '更新巡检',
        detail: `更新巡检记录：${item.customer.companyName} - ${item.powerEquipment}`,
        operatorId,
      },
    })
    return item
  }

  async remove(id: string, operatorId: string, operatorRole: UserRole) {
    if (operatorRole !== 'ADMIN' && operatorRole !== 'DEPT_MANAGER') {
      throw new ForbiddenException('需要管理员或部门负责人权限')
    }
    const existing = await this.prisma.inspection.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) throw new NotFoundException('巡检记录不存在')

    await this.prisma.inspectionLog.create({
      data: {
        inspectionId: id,
        action: '删除巡检',
        detail: `删除巡检记录（软删除）`,
        operatorId,
      },
    })
    await this.prisma.inspection.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    return { message: '删除成功' }
  }
}
