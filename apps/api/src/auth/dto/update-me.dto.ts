import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator'
import { Transform } from 'class-transformer'
import { Gender } from '@prisma/client'

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string

  @IsOptional()
  @IsString()
  avatar?: string
}
