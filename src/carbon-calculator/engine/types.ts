// ============================================================
// CALCULATOR ENGINE — TYPES
// Shared contracts for the tier-aware carbon calculation engine.
// ============================================================
import { ActivityCategory, DataTier, EmissionScope } from '@prisma/client'
import { AreaTypeKey } from '../config/emission-factors.config'

export type CommuteMode =
  | 'walk'
  | 'bicycle'
  | 'schoolBus'
  | 'publicBus'
  | 'motorbike'
  | 'car'

// ---- Per-category raw inputs (whatever tier the school could provide) ----
// Each category is resolved to a tier by which fields are present:
//   measured field present       → Tier 1 (MEASURED)
//   else proxy field(s) present   → Tier 2 (ESTIMATED)
//   else                          → Tier 3 (DEFAULT)

export interface ElectricityInput {
  measuredKwh?: number // Tier 1
  estimatedFromBill?: boolean // measuredKwh was derived from a bill → treat as Tier 2
  proxyHoursPerDay?: number // Tier 2
  proxyRooms?: number
  proxyWattsPerRoom?: number
  solarKwp?: number // optional offset (any tier) — derives generation from capacity
  solarAnnualKwh?: number // optional measured solar generation; preferred over solarKwp when given
}

export interface GeneratorInput {
  hasGenerator?: boolean
  measuredLitres?: number // Tier 1
  proxyHoursPerDay?: number // Tier 2
  proxyKva?: number
  proxyDaysPerYear?: number
}

// School-owned vehicle fuel. A fleet is summed into dieselLitres / petrolLitres;
// measuredLitres + fuelType is still accepted for backward compatibility.
export interface VehicleInput {
  dieselLitres?: number // Tier 1 — total annual diesel across the fleet
  petrolLitres?: number // Tier 1 — total annual petrol across the fleet
  vehicles?: unknown[] // raw per-vehicle rows, kept for transparency
  measuredLitres?: number // legacy single-vehicle
  fuelType?: 'diesel' | 'petrol' // legacy
}

export interface CookingInput {
  lpgLitres?: number // Tier 1 — litres of LPG (matches the per-litre factor)
  lpgKg?: number // Tier 1 — kg of LPG (converted to litres internally)
  firewoodKg?: number // Tier 1
  charcoalKg?: number // Tier 1
}

export interface RefrigerantInput {
  acUnits?: number // equipment counts — inventory only (no credible per-unit factor)
  refrigerators?: number
  waterCoolers?: number
  leakage?: unknown
}

export interface CommuteModeShare {
  mode: CommuteMode
  pct: number // % of students using this mode
  oneWayKm: number // average one-way distance
}

export interface CommuteInput {
  modes?: CommuteModeShare[] // Tier 1
  dominantMode?: CommuteMode // Tier 2
  avgDistanceKm?: number // Tier 2
}

export interface PaperInput {
  measuredKg?: number // Tier 1 (kg/year)
  reamsPerMonth?: number // Tier 1 (alternative)
}

export interface FoodInput {
  hasCanteen?: boolean
  measuredMealsPerYear?: number // Tier 1 (single dal-bhat factor)
  // Tier 1, finer split — emissions = veg×0.9 + mixed×1.8 + snacks×0.5
  vegMealsPerYear?: number
  mixedMealsPerYear?: number
  snacksPerYear?: number
  mealsPerDay?: number // Tier 2
}

// Waste treatment split (percentages, 0-100). When provided, emissions are
// allocated across landfill / open-burning / composting / recycling factors.
export interface WasteTreatment {
  landfill?: number
  burning?: number
  composting?: number
  recycling?: number
}

export interface WasteInput {
  measuredKgPerYear?: number // Tier 1 (preferred — already annual)
  measuredKgPerWeek?: number // Tier 1 (legacy — annualised by academicWeeksPerYear)
  segregation?: 'none' | 'two' | 'three' | 'full'
  composting?: boolean
  recycling?: boolean
  treatment?: WasteTreatment
}

export interface WaterInput {
  source?: 'municipal' | 'borewell' | 'gravity' | 'other'
  litresPerYear?: number // Tier 1 (meter / known consumption)
  billNprPerYear?: number // Tier 2 (bill → litres via tariff proxy)
}

export interface CategoryInputs {
  electricity?: ElectricityInput
  generator?: GeneratorInput
  vehicle?: VehicleInput
  cooking?: CookingInput
  refrigerant?: RefrigerantInput
  commute?: CommuteInput
  paper?: PaperInput
  food?: FoodInput
  waste?: WasteInput
  water?: WaterInput
}

// ---- Shared context for tier-2 proxies and tier-3 defaults ----
export interface AuditContext {
  enrollment: number
  areaType: AreaTypeKey
}

// ---- One resolved line item ----
export interface CategoryResolution {
  category: ActivityCategory
  scope: EmissionScope
  tier: DataTier
  activityValue: number // resolved quantity in `unit`
  unit: string
  emissions: number // kg CO2e
  inputs: unknown // raw inputs kept for transparency / recalculation
  note?: string
}

// ---- A category processor turns one category's input into a resolution ----
export interface CategoryProcessor {
  category: ActivityCategory
  /**
   * Resolve a category to a line item.
   * Returns null when the category is optional and the school provided
   * nothing (treated as a genuine zero, not a Tier-3 assumption).
   */
  resolve(input: unknown, ctx: AuditContext): CategoryResolution | null
}

// ---- Final compiled result ----
export interface CalculationResult {
  scope1Emissions: number
  scope2Emissions: number
  scope3Emissions: number
  totalEmissions: number
  emissionsPerStudent: number | null
  tier1Pct: number
  tier2Pct: number
  tier3Pct: number
  confidenceScore: number
  partiallyDefault: boolean
  grade: string | null
  breakdown: Record<string, unknown>
  recommendations: unknown[]
  resolutions: CategoryResolution[]
}
