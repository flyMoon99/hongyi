import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { FireInspectionsService } from './fire-inspections.service'
import { CreateFireInspectionDto } from './dto/create-fire-inspection.dto'
import { UpdateFireInspectionDto } from './dto/update-fire-inspection.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { CompanyRoleGuard, RequireModule } from '../common/company-role.guard'
import { CurrentUser } from '../common/current-user.decorator'
import { Company } from '@prisma/client'

@UseGuards(JwtAuthGuard, CompanyRoleGuard)
@RequireModule('fire-inspections')
@Controller('fire-inspections')
export class FireInspectionsController {
  constructor(private service: FireInspectionsService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('stationRoomId') stationRoomId?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.findAll(+page, +pageSize, stationRoomId, search, user?.company as Company)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateFireInspectionDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.company)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFireInspectionDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id)
  }
}
