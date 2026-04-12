import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ExperimentsService } from './experiments.service'
import { CreateExperimentDto } from './dto/create-experiment.dto'
import { UpdateExperimentDto } from './dto/update-experiment.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { RolesGuard } from '../common/roles.guard'
import { CurrentUser } from '../common/current-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('experiments')
export class ExperimentsController {
  constructor(private service: ExperimentsService) {}

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
  create(@Body() dto: CreateExperimentDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExperimentDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user.id)
  }

  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id, user.role)
  }
}
