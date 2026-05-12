import { Injectable, NotFoundException } from '@nestjs/common'
import { Company } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStationRoomDto } from './dto/create-station-room.dto'
import { UpdateStationRoomDto } from './dto/update-station-room.dto'

@Injectable()
export class StationRoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, search?: string, company?: Company) {
    const where: any = { isDeleted: false }
    if (company) where.company = company
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactPerson: { contains: search } },
      ]
    }
    const [items, total] = await Promise.all([
      this.prisma.stationRoom.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stationRoom.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const item = await this.prisma.stationRoom.findFirst({
      where: { id, isDeleted: false },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { operator: { select: { id: true, name: true } } },
        },
      },
    })
    if (!item) throw new NotFoundException('站室不存在')
    return item
  }

  async create(dto: CreateStationRoomDto, operatorId: string, company?: Company) {
    const item = await this.prisma.stationRoom.create({
      data: { ...dto, company: company ?? 'STATE_GRID' },
    })
    await this.prisma.stationRoomLog.create({
      data: {
        stationRoomId: item.id,
        action: '新增站室',
        detail: `新增站室：${item.name}`,
        operatorId,
      },
    })
    return item
  }

  async update(id: string, dto: UpdateStationRoomDto, operatorId: string) {
    await this.findOne(id)
    const item = await this.prisma.stationRoom.update({
      where: { id },
      data: dto,
    })
    await this.prisma.stationRoomLog.create({
      data: {
        stationRoomId: id,
        action: '修改站室',
        detail: `修改站室信息：${item.name}`,
        operatorId,
      },
    })
    return item
  }

  async remove(id: string, operatorId: string) {
    const item = await this.findOne(id)
    await this.prisma.stationRoomLog.create({
      data: {
        stationRoomId: id,
        action: '删除站室',
        detail: `删除站室：${item.name}`,
        operatorId,
      },
    })
    await this.prisma.stationRoom.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    return { message: '删除成功' }
  }
}
