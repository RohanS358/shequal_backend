import { IsEnum, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  Province, AreaType, SchoolType, SchoolContactRole,
  EnrollmentRange, ElectricityAvailability, InternetConnectivity, PreferredLanguage,
} from '@prisma/client'

export class UpdateSchoolDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  name?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  contactName?: string

  @ApiPropertyOptional({ enum: SchoolContactRole }) @IsOptional() @IsEnum(SchoolContactRole)
  contactRole?: SchoolContactRole

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  contactOther?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  @Matches(/^[+\d\s\-()]{7,20}$/, { message: 'Invalid phone number' })
  phone?: string

  @ApiPropertyOptional({ enum: Province }) @IsOptional() @IsEnum(Province)
  province?: Province

  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(60)
  district?: string

  @ApiPropertyOptional({ enum: AreaType }) @IsOptional() @IsEnum(AreaType)
  areaType?: AreaType

  @ApiPropertyOptional({ enum: SchoolType }) @IsOptional() @IsEnum(SchoolType)
  schoolType?: SchoolType

  @ApiPropertyOptional({ enum: EnrollmentRange }) @IsOptional() @IsEnum(EnrollmentRange)
  enrollment?: EnrollmentRange

  @ApiPropertyOptional({ enum: ElectricityAvailability }) @IsOptional() @IsEnum(ElectricityAvailability)
  electricity?: ElectricityAvailability

  @ApiPropertyOptional({ enum: InternetConnectivity }) @IsOptional() @IsEnum(InternetConnectivity)
  connectivity?: InternetConnectivity

  @ApiPropertyOptional({ enum: PreferredLanguage }) @IsOptional() @IsEnum(PreferredLanguage)
  language?: PreferredLanguage
}
