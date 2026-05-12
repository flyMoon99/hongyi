import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { UpdateEmployeeDto } from './dto/update-employee.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { CompanyRoleGuard, RequireModule } from '../common/company-role.guard'
import { CurrentUser } from '../common/current-user.decorator'
import { Company } from '@prisma/client'

@UseGuards(JwtAuthGuard, CompanyRoleGuard)
@RequireModule('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('search') search?: string,
    @Query('company') company?: Company,
    @CurrentUser() user?: any,
  ) {
    return this.service.findAll(+page, +pageSize, search, company, user)
  }

  /** 本人可查看自己的详情与操作日志；管理员/部门负责人可查看任意员工 */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user)
  }

  @Post()
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: any) {
    return this.service.create(dto, user)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user)
  }
}
