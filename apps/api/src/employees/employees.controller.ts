import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { AdminGuard } from '../common/admin.guard'

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('search') search?: string,
  ) {
    return this.service.findAll(+page, +pageSize, search)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto)
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(id, dto)
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
