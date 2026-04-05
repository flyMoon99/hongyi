import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { RolesGuard } from '../common/roles.guard'
import { CurrentUser } from '../common/current-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('companyName') companyName?: string,
    @Query('contactPerson') contactPerson?: string,
    @Query('contactInfo') contactInfo?: string,
  ) {
    return this.service.findAll(+page, +pageSize, companyName, contactPerson, contactInfo)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Get(':id/logs')
  getLogs(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.service.getLogs(id, +page, +pageSize)
  }

  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id)
  }

  @UseGuards(RolesGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user.id)
  }

  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id)
  }
}
