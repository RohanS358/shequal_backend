import { IsString, IsEmail, IsEnum, IsOptional, MinLength, MaxLength, Matches } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SchoolContactRole } from '@prisma/client'

export class SchoolStep1Dto {
  @ApiProperty({ example: 'Green Valley School' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  schoolName: string

  @ApiProperty({ example: 'Ram Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  contactName: string

  @ApiProperty({ enum: SchoolContactRole, example: SchoolContactRole.PRINCIPAL })
  @IsEnum(SchoolContactRole)
  contactRole: SchoolContactRole

  @ApiPropertyOptional({ example: 'Deputy Principal' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  contactOther?: string

  @ApiProperty({ example: 'principal@greenvalley.edu.np' })
  @IsEmail()
  email: string

  @ApiPropertyOptional({ example: '+977-1-5552345' })
  @IsOptional()
  @IsString()
  @Matches(/^[+\d\s\-()]{7,20}$/, { message: 'Invalid phone number format' })
  phone?: string

  // Password for the school admin account, collected at step 1
  @ApiProperty({ example: 'School@1234', description: 'Min 8 chars, used to create the school admin account' })
  @IsString()
  @MinLength(8)
  password: string
}
