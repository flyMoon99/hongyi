import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator'
import { ExperimentFrequency } from '@prisma/client'

export class CreateExperimentDto {
  @IsString()
  @IsNotEmpty({ message: '客户ID不能为空' })
  customerId: string

  @IsEnum(ExperimentFrequency, { message: '试验频率值无效' })
  frequency: ExperimentFrequency

  @IsString()
  @IsNotEmpty({ message: '电力设备不能为空' })
  powerEquipment: string

  @IsOptional()
  @IsString()
  lastTestDate?: string

  @IsOptional()
  @IsString()
  nextTestDate?: string

  @IsOptional()
  @IsString()
  safetyTools?: string

  @IsString()
  @IsNotEmpty({ message: '试验联系人不能为空' })
  contactPerson: string

  @IsString()
  @IsNotEmpty({ message: '试验联系方式不能为空' })
  contactInfo: string
}
