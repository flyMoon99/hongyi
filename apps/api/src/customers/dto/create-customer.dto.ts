import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: '企业名称不能为空' })
  companyName: string

  @IsOptional()
  @IsString()
  projectOverview?: string

  @IsString()
  @IsNotEmpty({ message: '联系人不能为空' })
  contactPerson: string

  @IsString()
  @IsNotEmpty({ message: '联系方式不能为空' })
  contactInfo: string

  @IsOptional()
  @IsString()
  lastPatrolTime?: string
}
