import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ExperimentsService } from './experiments.service'
import { CreateExperimentDto } from './dto/create-experiment.dto'
import { UpdateExperimentDto } from './dto/update-experiment.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'

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
  create(@Body() dto: CreateExperimentDto, @Request() req: any) {
    return this.service.create(dto, req.user.id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExperimentDto, @Request() req: any) {
    return this.service.update(id, dto, req.user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.id)
  }
}
