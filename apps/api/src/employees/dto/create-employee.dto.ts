import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail } from 'class-validator'
import { Transform } from 'class-transformer'
import { Gender, UserRole } from '@prisma/client'

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  name: string

  @IsEnum(Gender, { message: '性别值无效' })
  gender: Gender

  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string

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
