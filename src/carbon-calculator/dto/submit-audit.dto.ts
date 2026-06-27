import { IsInt, IsObject, IsOptional, IsString, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  CommuteInput,
  CookingInput,
  ElectricityInput,
  FoodInput,
  GeneratorInput,
  PaperInput,
  RefrigerantInput,
  VehicleInput,
  WasteInput,
  WaterInput,
} from '../engine/types'

// ------------------------------------------------------------
// SUBMIT AUDIT DTO
// Per-category inputs are accepted as objects and resolved by the
// engine (which coerces every field defensively and picks the data
// tier). Top-level period fields are strictly validated.
// ------------------------------------------------------------
export class SubmitAuditDto {
  @ApiProperty({ example: 2024, description: 'Academic year of the audit' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  academicYear: number

  @ApiPropertyOptional({ example: 0, description: 'Month (1-12) for monthly audits, 0 / omit for annual' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(12)
  @Type(() => Number)
  month?: number

  @ApiPropertyOptional({ example: 320, description: 'Enrolled student count (for per-student intensity & proxies)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  enrollment?: number

  @ApiPropertyOptional({ example: 'URBAN', description: 'URBAN | PERI_URBAN | RURAL — defaults to the school record' })
  @IsOptional()
  @IsString()
  areaType?: string

  // ---- Per-category activity data (see engine/types.ts for shapes) ----
  @ApiPropertyOptional({ description: 'Electricity (Scope 2). Tier1: measuredKwh. Tier2: proxyHoursPerDay+proxyRooms[+proxyWattsPerRoom]. solarKwp optional offset.' })
  @IsOptional() @IsObject()
  electricity?: ElectricityInput

  @ApiPropertyOptional({ description: 'Generator fuel (Scope 1). Tier1: measuredLitres. Tier2: proxyHoursPerDay+proxyKva[+proxyDaysPerYear]. hasGenerator enables Tier3.' })
  @IsOptional() @IsObject()
  generator?: GeneratorInput

  @ApiPropertyOptional({ description: 'School vehicle fuel (Scope 1). measuredLitres + fuelType(diesel|petrol).' })
  @IsOptional() @IsObject()
  vehicle?: VehicleInput

  @ApiPropertyOptional({ description: 'Cooking fuel (Scope 1). lpgKg and/or firewoodKg.' })
  @IsOptional() @IsObject()
  cooking?: CookingInput

  @ApiPropertyOptional({ description: 'Refrigerant (Scope 1). acUnits count.' })
  @IsOptional() @IsObject()
  refrigerant?: RefrigerantInput

  @ApiPropertyOptional({ description: 'Commuting (Scope 3). Tier1: modes[{mode,pct,oneWayKm}]. Tier2: dominantMode+avgDistanceKm.' })
  @IsOptional() @IsObject()
  commute?: CommuteInput

  @ApiPropertyOptional({ description: 'Paper (Scope 3). Tier1: measuredKg or reamsPerMonth. Else per-student proxy.' })
  @IsOptional() @IsObject()
  paper?: PaperInput

  @ApiPropertyOptional({ description: 'Food/canteen (Scope 3). hasCanteen + measuredMealsPerYear (Tier1) or mealsPerDay (Tier2).' })
  @IsOptional() @IsObject()
  food?: FoodInput

  @ApiPropertyOptional({ description: 'Waste (Scope 3). Tier1: measuredKgPerWeek. treatment{landfill,burning,composting,recycling} %% split, else segregation/composting/recycling reduce landfill.' })
  @IsOptional() @IsObject()
  waste?: WasteInput

  @ApiPropertyOptional({ description: 'Water (Scope 3, minor). litresPerYear (Tier1) or billNprPerYear (Tier2); source gravity→0, else pumped proxy.' })
  @IsOptional() @IsObject()
  water?: WaterInput

  @ApiPropertyOptional({ description: 'Custom emission factor overrides: factor key → kg CO₂e per unit. Applied only for this calculation; global defaults are restored immediately after.' })
  @IsOptional() @IsObject()
  customFactors?: Record<string, number>
}
