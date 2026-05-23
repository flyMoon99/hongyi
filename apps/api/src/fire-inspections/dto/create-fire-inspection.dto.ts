import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator'
import { FireEquipment, FireInspectionFrequency } from '@prisma/client'

export class CreateFireInspectionDto {
  @IsString()
  @IsNotEmpty({ message: '站室ID不能为空' })
  stationRoomId: string

  @IsEnum(FireInspectionFrequency, { message: '巡检频率值无效' })
  frequency: FireInspectionFrequency

  @IsString()
  @IsNotEmpty({ message: '负责人不能为空' })
  responsiblePerson: string

  @IsArray()
  @IsEnum(FireEquipment, { each: true, message: '消防设备值无效' })
  equipment: FireEquipment[]

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

  @IsString()
  @IsNotEmpty({ message: '巡检联系人不能为空' })
  contactPerson: string

  @IsString()
  @IsNotEmpty({ message: '巡检联系方式不能为空' })
  contactInfo: string
}
