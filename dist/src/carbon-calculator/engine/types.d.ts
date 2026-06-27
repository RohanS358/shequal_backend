import { ActivityCategory, DataTier, EmissionScope } from '@prisma/client';
import { AreaTypeKey } from '../config/emission-factors.config';
export type CommuteMode = 'walk' | 'bicycle' | 'schoolBus' | 'publicBus' | 'motorbike' | 'car';
export interface ElectricityInput {
    measuredKwh?: number;
    estimatedFromBill?: boolean;
    proxyHoursPerDay?: number;
    proxyRooms?: number;
    proxyWattsPerRoom?: number;
    solarKwp?: number;
    solarAnnualKwh?: number;
}
export interface GeneratorInput {
    hasGenerator?: boolean;
    measuredLitres?: number;
    proxyHoursPerDay?: number;
    proxyKva?: number;
    proxyDaysPerYear?: number;
}
export interface VehicleInput {
    dieselLitres?: number;
    petrolLitres?: number;
    vehicles?: unknown[];
    measuredLitres?: number;
    fuelType?: 'diesel' | 'petrol';
}
export interface CookingInput {
    lpgLitres?: number;
    lpgKg?: number;
    firewoodKg?: number;
    charcoalKg?: number;
}
export interface RefrigerantInput {
    acUnits?: number;
    refrigerators?: number;
    waterCoolers?: number;
    leakage?: unknown;
}
export interface CommuteModeShare {
    mode: CommuteMode;
    pct: number;
    oneWayKm: number;
}
export interface CommuteInput {
    modes?: CommuteModeShare[];
    dominantMode?: CommuteMode;
    avgDistanceKm?: number;
}
export interface PaperInput {
    measuredKg?: number;
    reamsPerMonth?: number;
}
export interface FoodInput {
    hasCanteen?: boolean;
    measuredMealsPerYear?: number;
    vegMealsPerYear?: number;
    mixedMealsPerYear?: number;
    snacksPerYear?: number;
    mealsPerDay?: number;
}
export interface WasteTreatment {
    landfill?: number;
    burning?: number;
    composting?: number;
    recycling?: number;
}
export interface WasteInput {
    measuredKgPerYear?: number;
    measuredKgPerWeek?: number;
    segregation?: 'none' | 'two' | 'three' | 'full';
    composting?: boolean;
    recycling?: boolean;
    treatment?: WasteTreatment;
}
export interface WaterInput {
    source?: 'municipal' | 'borewell' | 'gravity' | 'other';
    litresPerYear?: number;
    billNprPerYear?: number;
}
export interface CategoryInputs {
    electricity?: ElectricityInput;
    generator?: GeneratorInput;
    vehicle?: VehicleInput;
    cooking?: CookingInput;
    refrigerant?: RefrigerantInput;
    commute?: CommuteInput;
    paper?: PaperInput;
    food?: FoodInput;
    waste?: WasteInput;
    water?: WaterInput;
}
export interface AuditContext {
    enrollment: number;
    areaType: AreaTypeKey;
}
export interface CategoryResolution {
    category: ActivityCategory;
    scope: EmissionScope;
    tier: DataTier;
    activityValue: number;
    unit: string;
    emissions: number;
    inputs: unknown;
    note?: string;
}
export interface CategoryProcessor {
    category: ActivityCategory;
    resolve(input: unknown, ctx: AuditContext): CategoryResolution | null;
}
export interface CalculationResult {
    scope1Emissions: number;
    scope2Emissions: number;
    scope3Emissions: number;
    totalEmissions: number;
    emissionsPerStudent: number | null;
    tier1Pct: number;
    tier2Pct: number;
    tier3Pct: number;
    confidenceScore: number;
    partiallyDefault: boolean;
    grade: string | null;
    breakdown: Record<string, unknown>;
    recommendations: unknown[];
    resolutions: CategoryResolution[];
}
