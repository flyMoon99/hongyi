import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { JwtAuthGuard } from '../common/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

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

  @Get(':id/logs')
  getLogs(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.service.getLogs(id, +page, +pageSize)
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @Request() req: any) {
    return this.service.create(dto, req.user.id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Request() req: any) {
    return this.service.update(id, dto, req.user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.id)
  }
}
