import { Injectable, NotFoundException } from '@nestjs/common'
import { Company } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFireInspectionDto } from './dto/create-fire-inspection.dto'
import { UpdateFireInspectionDto } from './dto/update-fire-inspection.dto'

const STATION_SELECT = { id: true, name: true }

@Injectable()
export class FireInspectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, stationRoomId?: string, search?: string, company?: Company) {
    const where: any = { isDeleted: false }
    if (company) where.company = company
    if (stationRoomId) where.stationRoomId = stationRoomId
    if (search) {
      where.OR = [
        { responsiblePerson: { contains: search } },
        { stationRoom: { name: { contains: search } } },
        { contactPerson: { contains: search } },
      ]
    }
    const [items, total] = await Promise.all([
      this.prisma.fireInspection.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { stationRoom: { select: STATION_SELECT } },
      }),
      this.prisma.fireInspection.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const item = await this.prisma.fireInspection.findUnique({
      where: { id },
      include: {
        stationRoom: { select: STATION_SELECT },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { operator: { select: { id: true, name: true } } },
        },
      },
    })
    if (!item || item.isDeleted) throw new NotFoundException('消防巡检记录不存在')
    return item
  }

  async create(dto: CreateFireInspectionDto, operatorId: string, company?: Company) {
    const item = await this.prisma.fireInspection.create({
      data: {
        stationRoomId: dto.stationRoomId,
        frequency: dto.frequency,
        responsiblePerson: dto.responsiblePerson,
        equipment: dto.equipment,
        contactPerson: dto.contactPerson,
        contactInfo: dto.contactInfo,
        remark: dto.remark,
        lastInspectionDate: dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : undefined,
        nextInspectionDate: dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : undefined,
        company: company ?? 'STATE_GRID',
      },
      include: { stationRoom: { select: STATION_SELECT } },
    })
    await this.prisma.fireInspectionLog.create({
      data: {
        fireInspectionId: item.id,
        action: '新增消防巡检',
        detail: `新增消防巡检：${item.stationRoom.name} - ${item.responsiblePerson}`,
        operatorId,
      },
    })
    return item
  }

  async update(id: string, dto: UpdateFireInspectionDto, operatorId: string) {
    await this.findOne(id)
    const data: any = { ...dto }
    if (dto.lastInspectionDate !== undefined) {
      data.lastInspectionDate = dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : null
    }
    if (dto.nextInspectionDate !== undefined) {
      data.nextInspectionDate = dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : null
    }
    const item = await this.prisma.fireInspection.update({
      where: { id },
      data,
      include: { stationRoom: { select: STATION_SELECT } },
    })
    await this.prisma.fireInspectionLog.create({
      data: {
        fireInspectionId: id,
        action: '修改消防巡检',
        detail: `修改消防巡检：${item.stationRoom.name} - ${item.responsiblePerson}`,
        operatorId,
      },
    })
    return item
  }

  async remove(id: string, operatorId: string) {
    const existing = await this.prisma.fireInspection.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) throw new NotFoundException('消防巡检记录不存在')

    await this.prisma.fireInspectionLog.create({
      data: {
        fireInspectionId: id,
        action: '删除消防巡检',
        detail: '删除消防巡检记录（软删除）',
        operatorId,
      },
    })
    await this.prisma.fireInspection.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    return { message: '删除成功' }
  }
}
