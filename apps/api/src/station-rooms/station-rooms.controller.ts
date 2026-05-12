import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { StationRoomsService } from './station-rooms.service'
import { CreateStationRoomDto } from './dto/create-station-room.dto'
import { UpdateStationRoomDto } from './dto/update-station-room.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { CompanyRoleGuard, RequireModule } from '../common/company-role.guard'
import { CurrentUser } from '../common/current-user.decorator'
import { Company } from '@prisma/client'

@UseGuards(JwtAuthGuard, CompanyRoleGuard)
@RequireModule('station-rooms')
@Controller('station-rooms')
export class StationRoomsController {
  constructor(private service: StationRoomsService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.findAll(+page, +pageSize, search, user?.company as Company)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateStationRoomDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.company)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStationRoomDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id)
  }
}
