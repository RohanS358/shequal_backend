import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(80)
  name?: string
}

export class ChangePasswordDto {
  @ApiPropertyOptional() @IsString() @MinLength(8)
  currentPassword: string

  @ApiPropertyOptional() @IsString() @MinLength(8)
  newPassword: string
}
