import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator'
import { FireEquipment, FireInspectionFrequency } from '@prisma/client'

export class UpdateFireInspectionDto {
  @IsOptional()
  @IsString()
  stationRoomId?: string

  @IsOptional()
  @IsEnum(FireInspectionFrequency, { message: '巡检频率值无效' })
  frequency?: FireInspectionFrequency

  @IsOptional()
  @IsString()
  responsiblePerson?: string

  @IsOptional()
  @IsArray()
  @IsEnum(FireEquipment, { each: true, message: '消防设备值无效' })
  equipment?: FireEquipment[]

  @IsOptional()
  @IsString()
  gasLastInspectionDate?: string

  @IsOptional()
  @IsString()
  gasNextInspectionDate?: string

  @IsOptional()
  @IsString()
  extLastInspectionDate?: string

  @IsOptional()
  @IsString()
  extNextInspectionDate?: string

  @IsOptional()
  @IsString()
  remark?: string

  @IsOptional()
  @IsString()
  contactPerson?: string

  @IsOptional()
  @IsString()
  contactInfo?: string
}
