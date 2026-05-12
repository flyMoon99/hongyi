import { Module } from '@nestjs/common'
import { StationRoomsController } from './station-rooms.controller'
import { StationRoomsService } from './station-rooms.service'
import { CompanyRoleGuard } from '../common/company-role.guard'

@Module({
  controllers: [StationRoomsController],
  providers: [StationRoomsService, CompanyRoleGuard],
  exports: [StationRoomsService],
})
export class StationRoomsModule {}
