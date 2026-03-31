import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { EmployeesModule } from './employees/employees.module'
import { CustomersModule } from './customers/customers.module'
import { InspectionsModule } from './inspections/inspections.module'
import { ExperimentsModule } from './experiments/experiments.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    CustomersModule,
    InspectionsModule,
    ExperimentsModule,
  ],
})
export class AppModule {}
