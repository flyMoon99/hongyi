import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateStationRoomDto {
  @IsString()
  @IsNotEmpty({ message: '站室名称不能为空' })
  name: string

  @IsOptional()
  @IsString()
  remark?: string

  @IsString()
  @IsNotEmpty({ message: '负责人不能为空' })
  contactPerson: string

  @IsString()
  @IsNotEmpty({ message: '联系方式不能为空' })
  contactInfo: string
}
