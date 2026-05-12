import { IsString, IsOptional } from 'class-validator'

export class UpdateStationRoomDto {
  @IsOptional()
  @IsString()
  name?: string

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
