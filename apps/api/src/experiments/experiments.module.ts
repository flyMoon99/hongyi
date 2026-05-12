import { Module } from '@nestjs/common'
import { ExperimentsController } from './experiments.controller'
import { ExperimentsService } from './experiments.service'
import { CompanyRoleGuard } from '../common/company-role.guard'

@Module({
  controllers: [ExperimentsController],
  providers: [ExperimentsService, CompanyRoleGuard],
})
export class ExperimentsModule {}
