import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { InspectionsService } from './inspections.service'
import { CreateInspectionDto } from './dto/create-inspection.dto'
import { UpdateInspectionDto } from './dto/update-inspection.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(private service: InspectionsService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(+page, +pageSize, customerId, search)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateInspectionDto, @Request() req: any) {
    return this.service.create(dto, req.user.id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInspectionDto, @Request() req: any) {
    return this.service.update(id, dto, req.user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.id)
  }
}
