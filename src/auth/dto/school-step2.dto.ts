import { IsEnum, IsString, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Province, AreaType, SchoolType } from '@prisma/client'

export class SchoolStep2Dto {
  @ApiProperty({ enum: Province, example: Province.BAGMATI })
  @IsEnum(Province)
  province: Province

  @ApiProperty({ example: 'Lalitpur' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  district: string

  @ApiProperty({ enum: AreaType, example: AreaType.URBAN })
  @IsEnum(AreaType)
  areaType: AreaType

  @ApiProperty({ enum: SchoolType, example: SchoolType.PRIVATE })
  @IsEnum(SchoolType)
  schoolType: SchoolType
}
