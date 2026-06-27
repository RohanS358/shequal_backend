import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { EnrollmentRange, ElectricityAvailability, InternetConnectivity, PreferredLanguage } from '@prisma/client'

export class SchoolStep3Dto {
  @ApiProperty({ enum: EnrollmentRange, example: EnrollmentRange.RANGE_100_500 })
  @IsEnum(EnrollmentRange)
  enrollment: EnrollmentRange

  @ApiProperty({ enum: ElectricityAvailability, example: ElectricityAvailability.LOAD_SHEDDING })
  @IsEnum(ElectricityAvailability)
  electricity: ElectricityAvailability

  @ApiProperty({ enum: InternetConnectivity, example: InternetConnectivity.INTERMITTENT })
  @IsEnum(InternetConnectivity)
  connectivity: InternetConnectivity

  @ApiProperty({ enum: PreferredLanguage, example: PreferredLanguage.ENGLISH })
  @IsEnum(PreferredLanguage)
  language: PreferredLanguage
}
