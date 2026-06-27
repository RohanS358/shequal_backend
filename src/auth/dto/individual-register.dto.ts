import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// Individual registration is now student-only and must be tied to a
// registered school (the student joins that school's portal).
export class IndividualRegisterDto {
  @ApiProperty({ example: 'Sita Thapa' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string

  @ApiProperty({ example: 'sita@gmail.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'clxyz123', description: 'Id of the registered school the student belongs to' })
  @IsString()
  schoolId: string

  @ApiPropertyOptional({ example: 'I want to help reduce my school carbon footprint' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  whyInterested?: string

  @ApiProperty({ example: 'Student@1234', description: 'Min 8 characters — creates your login account' })
  @IsString()
  @MinLength(8)
  password: string
}
