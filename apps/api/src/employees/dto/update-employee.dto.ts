import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator'
import { Transform } from 'class-transformer'
import { Gender, UserRole } from '@prisma/client'

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsString()
  avatar?: string

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string

  @IsOptional()
  @IsEnum(UserRole, { message: '角色值无效' })
  role?: UserRole
}
