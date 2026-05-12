import { Module } from '@nestjs/common'
import { FireInspectionsController } from './fire-inspections.controller'
import { FireInspectionsService } from './fire-inspections.service'
import { CompanyRoleGuard } from '../common/company-role.guard'

@Module({
  controllers: [FireInspectionsController],
  providers: [FireInspectionsService, CompanyRoleGuard],
  exports: [FireInspectionsService],
})
export class FireInspectionsModule {}
