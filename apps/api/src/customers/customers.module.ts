import { Module } from '@nestjs/common'
import { CustomersController } from './customers.controller'
import { CustomersService } from './customers.service'
import { CompanyRoleGuard } from '../common/company-role.guard'

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, CompanyRoleGuard],
})
export class CustomersModule {}
