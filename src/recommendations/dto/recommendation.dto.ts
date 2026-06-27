import { IsObject, IsOptional, IsString, IsArray, IsInt, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { RecAudience } from '@prisma/client'

export class QuestAnswersDto {
  @ApiProperty({ example: { q1: 'car', q4: 'dal_meat' }, description: 'Map of quest question id → chosen option value' })
  @IsObject()
  answers: Record<string, string>
}

export class CreateRecommendationDto {
  @ApiProperty({ enum: RecAudience })
  @IsEnum(RecAudience)
  audience: RecAudience

  @ApiProperty({ example: 'stu_commute' })
  @IsString()
  ruleKey: string

  @ApiPropertyOptional() @IsOptional() @IsString() category?: string
  @ApiPropertyOptional() @IsOptional() @IsString() triggerKey?: string
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) triggerValues?: string[]
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleEn?: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleNe?: string
  @ApiProperty() @IsString() textEn: string
  @ApiProperty() @IsString() textNe: string
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) weight?: number
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) co2SavedKg?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean
}

export class UpdateRecommendationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string
  @ApiPropertyOptional() @IsOptional() @IsString() triggerKey?: string
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) triggerValues?: string[]
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleEn?: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleNe?: string
  @ApiPropertyOptional() @IsOptional() @IsString() textEn?: string
  @ApiPropertyOptional() @IsOptional() @IsString() textNe?: string
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) weight?: number
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) co2SavedKg?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean
}
