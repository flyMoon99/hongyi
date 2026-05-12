import { Module } from '@nestjs/common'
import { InspectionsController } from './inspections.controller'
import { InspectionsService } from './inspections.service'
import { CompanyRoleGuard } from '../common/company-role.guard'

@Module({
  controllers: [InspectionsController],
  providers: [InspectionsService, CompanyRoleGuard],
})
export class InspectionsModule {}
