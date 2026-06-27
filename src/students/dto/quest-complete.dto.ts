import { IsInt, IsNumber, IsOptional, IsString, Min, Matches } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class QuestCompleteDto {
  @ApiProperty({ example: 320, description: 'XP earned in this quest' })
  @IsInt()
  @Min(0)
  gained: number

  @ApiPropertyOptional({ example: 2.1, description: 'kg CO2e the recommendations could save' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  co2Saved?: number

  @ApiPropertyOptional({ example: '2026-06-25', description: "Student's local day (YYYY-MM-DD); used for streak + 'done today'" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'penguin' })
  @IsOptional()
  @IsString()
  petSpecies?: string

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  petHappiness?: number
}
