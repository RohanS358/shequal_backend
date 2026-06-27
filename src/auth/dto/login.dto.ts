import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'principal@greenvalley.edu.np' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'School@1234' })
  @IsString()
  @MinLength(8)
  password: string

  // When the user reached login via "search your school", this is that
  // school's id. The account must belong to it, otherwise login is refused.
  @ApiPropertyOptional({ example: 'clxyz123', description: 'Selected school id — account must belong to it' })
  @IsOptional()
  @IsString()
  schoolId?: string
}
