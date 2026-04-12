import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator'
import { InspectionFrequency } from '@prisma/client'

export class CreateInspectionDto {
  @IsString()
  @IsNotEmpty({ message: '客户ID不能为空' })
  customerId: string

  @IsString()
  @IsNotEmpty({ message: '负责人不能为空' })
  responsiblePersonId: string

  @IsEnum(InspectionFrequency, { message: '巡检频率值无效' })
  frequency: InspectionFrequency

  @IsString()
  @IsNotEmpty({ message: '电力设备不能为空' })
  powerEquipment: string

  @IsOptional()
  @IsString()
  lastInspectionDate?: string

  @IsOptional()
  @IsString()
  nextInspectionDate?: string

  @IsOptional()
  @IsString()
  safetyTools?: string

  @IsString()
  @IsNotEmpty({ message: '巡检联系人不能为空' })
  contactPerson: string

  @IsString()
  @IsNotEmpty({ message: '巡检联系方式不能为空' })
  contactInfo: string
}
