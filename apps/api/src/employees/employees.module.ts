import { Module } from '@nestjs/common'
import { EmployeesController } from './employees.controller'
import { EmployeesService } from './employees.service'
import { CompanyRoleGuard } from '../common/company-role.guard'

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, CompanyRoleGuard],
  exports: [EmployeesService],
})
export class EmployeesModule {}
