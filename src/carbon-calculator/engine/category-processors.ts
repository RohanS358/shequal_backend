// ============================================================
// CATEGORY PROCESSORS
// One processor per spec section-4 category. Each implements the
// three-tier branching (spec section 3):
//   measured value  → Tier 1 (MEASURED)
//   proxy answer    → Tier 2 (ESTIMATED)
//   nothing usable  → Tier 3 (DEFAULT, national/regional average)
//
// "Core" categories (electricity, commute, paper, waste) always
// produce a line — falling back to a Tier-3 default when skipped
// (spec section 9). "Optional" categories (generator, vehicle,
// cooking, refrigerant, food) return null when the school has none,
// so they are treated as a genuine zero rather than an assumption.
// ============================================================
import { ActivityCategory, DataTier, EmissionScope } from '@prisma/client'
import {
  DERIVATION_CONSTANTS as D,
  EMISSION_FACTORS as F,
  TIER3_DEFAULTS as T3,
} from '../config/emission-factors.config'
import {
  AuditContext,
  CategoryProcessor,
  CategoryResolution,
  CommuteInput,
  CommuteMode,
  CookingInput,
  ElectricityInput,
  FoodInput,
  GeneratorInput,
  PaperInput,
  RefrigerantInput,
  VehicleInput,
  WasteInput,
  WaterInput,
} from './types'

// ---- helpers ----
// Numeric presence (used for measured quantities & proxy numbers).
const present = (v: unknown): boolean =>
  v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v))
// Generic non-empty presence (used for categorical/string answers).
const filled = (v: unknown): boolean =>
  v !== undefined && v !== null && v !== ''
const num = (v: unknown): number => (present(v) ? Number(v) : 0)
const round = (v: number): number => Math.round(v * 100) / 100

const COMMUTE_FACTOR_KEY: Record<CommuteMode, keyof typeof F> = {
  walk: 'commuteWalk',
  bicycle: 'commuteBicycle',
  schoolBus: 'commuteSchoolBus',
  publicBus: 'commutePublicBus',
  motorbike: 'commuteMotorbike',
  car: 'commuteCar',
}

const WASTE_LANDFILL_RATE: Record<string, number> = {
  none: 1.0,
  two: 0.7,
  three: 0.5,
  full: 0.3,
}

// ------------------------------------------------------------
// ELECTRICITY — Scope 2 (core)
// ------------------------------------------------------------
const electricity: CategoryProcessor = {
  category: ActivityCategory.ELECTRICITY,
  resolve(raw, ctx): CategoryResolution {
    const e = (raw || {}) as ElectricityInput
    let kWh: number
    let tier: DataTier

    if (present(e.measuredKwh)) {
      // A bill-derived kWh is an estimate, not a meter reading.
      tier = e.estimatedFromBill ? DataTier.ESTIMATED : DataTier.MEASURED
      kWh = num(e.measuredKwh)
    } else if (present(e.proxyHoursPerDay) && present(e.proxyRooms)) {
      tier = DataTier.ESTIMATED
      const watts = present(e.proxyWattsPerRoom)
        ? num(e.proxyWattsPerRoom)
        : D.defaultWattsPerRoom
      kWh =
        num(e.proxyHoursPerDay) *
        num(e.proxyRooms) *
        (watts / 1000) *
        D.schoolDaysPerYear
    } else {
      tier = DataTier.DEFAULT
      kWh = T3.electricityKwhPerStudentYear[ctx.areaType] * ctx.enrollment
    }

    // Optional solar offset (applies at any tier). Prefer a measured annual
    // generation figure when the school provides one; otherwise derive it from
    // the installed capacity via Nepal's solar capacity factor.
    const solarKwh = present(e.solarAnnualKwh)
      ? num(e.solarAnnualKwh)
      : num(e.solarKwp) * D.solarCapacityFactor * D.hoursPerYear
    const netKwh = Math.max(0, kWh - solarKwh)
    const emissions = netKwh * F.gridElectricity.value

    return {
      category: ActivityCategory.ELECTRICITY,
      scope: EmissionScope.SCOPE_2,
      tier,
      activityValue: round(netKwh),
      unit: F.gridElectricity.unit,
      emissions: round(emissions),
      inputs: e,
    }
  },
}

// ------------------------------------------------------------
// GENERATOR FUEL — Scope 1 (optional)
// ------------------------------------------------------------
const generator: CategoryProcessor = {
  category: ActivityCategory.GENERATOR_FUEL,
  resolve(raw, ctx): CategoryResolution | null {
    const g = (raw || {}) as GeneratorInput
    let litres: number
    let tier: DataTier

    if (present(g.measuredLitres)) {
      tier = DataTier.MEASURED
      litres = num(g.measuredLitres)
    } else if (present(g.proxyHoursPerDay) && present(g.proxyKva)) {
      tier = DataTier.ESTIMATED
      const days = present(g.proxyDaysPerYear)
        ? num(g.proxyDaysPerYear)
        : D.schoolDaysPerYear
      litres =
        num(g.proxyHoursPerDay) *
        num(g.proxyKva) *
        D.generatorLitresPerKvaHour *
        days
    } else if (g.hasGenerator) {
      tier = DataTier.DEFAULT
      litres = T3.generatorLitresPerStudentYear[ctx.areaType] * ctx.enrollment
    } else {
      return null // no generator → genuine zero (spec section 4B)
    }

    const emissions = litres * F.dieselCombustion.value
    return {
      category: ActivityCategory.GENERATOR_FUEL,
      scope: EmissionScope.SCOPE_1,
      tier,
      activityValue: round(litres),
      unit: F.dieselCombustion.unit,
      emissions: round(emissions),
      inputs: g,
    }
  },
}

// ------------------------------------------------------------
// VEHICLE FUEL — Scope 1 (optional)
// ------------------------------------------------------------
const vehicle: CategoryProcessor = {
  category: ActivityCategory.VEHICLE_FUEL,
  resolve(raw): CategoryResolution | null {
    const v = (raw || {}) as VehicleInput
    // Aggregate the fleet by fuel; fold in the legacy single-vehicle fields.
    let diesel = num(v.dieselLitres)
    let petrol = num(v.petrolLitres)
    if (present(v.measuredLitres)) {
      if (v.fuelType === 'petrol') petrol += num(v.measuredLitres)
      else diesel += num(v.measuredLitres)
    }
    if (diesel <= 0 && petrol <= 0) return null
    const litres = diesel + petrol
    const emissions = diesel * F.dieselCombustion.value + petrol * F.petrolCombustion.value
    return {
      category: ActivityCategory.VEHICLE_FUEL,
      scope: EmissionScope.SCOPE_1,
      tier: DataTier.MEASURED,
      activityValue: round(litres),
      unit: F.dieselCombustion.unit,
      emissions: round(emissions),
      inputs: v,
      note: 'School-owned fleet; diesel + petrol combined (see inputs for the split).',
    }
  },
}

// ------------------------------------------------------------
// COOKING FUEL — Scope 1 (optional): LPG + firewood + charcoal
//   LPG is collected in kg → converted to litres so the per-litre
//   factor applies. Firewood & charcoal use their per-kg factors.
// ------------------------------------------------------------
const cooking: CategoryProcessor = {
  category: ActivityCategory.COOKING_FUEL,
  resolve(raw): CategoryResolution | null {
    const c = (raw || {}) as CookingInput
    if (!present(c.lpgLitres) && !present(c.lpgKg) && !present(c.firewoodKg) && !present(c.charcoalKg)) return null
    // LPG: prefer litres (matches the factor unit); else convert kg → litres.
    const lpgLitres = present(c.lpgLitres) ? num(c.lpgLitres) : num(c.lpgKg) / D.lpgKgPerLitre
    const wood = num(c.firewoodKg)
    const charcoal = num(c.charcoalKg)
    const emissions =
      lpgLitres * F.lpg.value + wood * F.firewood.value + charcoal * F.charcoal.value
    const lpgKgEquiv = lpgLitres * D.lpgKgPerLitre // for a comparable kg activity figure
    return {
      category: ActivityCategory.COOKING_FUEL,
      scope: EmissionScope.SCOPE_1,
      tier: DataTier.MEASURED,
      activityValue: round(lpgKgEquiv + wood + charcoal),
      unit: 'kg',
      emissions: round(emissions),
      inputs: { ...c, lpgLitres: round(lpgLitres) },
      note: 'LPG (litres) + firewood + charcoal combined; see inputs for the split.',
    }
  },
}

// ------------------------------------------------------------
// REFRIGERANT — Scope 1 (inventory only).
// The reference factor set has no credible per-unit HFC-leakage factor, so
// equipment counts are recorded for the school's inventory but contribute 0
// to the footprint (rather than the old fabricated 100 kg/unit placeholder).
// ------------------------------------------------------------
const refrigerant: CategoryProcessor = {
  category: ActivityCategory.REFRIGERANT,
  resolve(raw): CategoryResolution | null {
    const r = (raw || {}) as RefrigerantInput
    const units = num(r.acUnits) + num(r.refrigerators) + num(r.waterCoolers)
    if (units <= 0) return null
    return {
      category: ActivityCategory.REFRIGERANT,
      scope: EmissionScope.SCOPE_1,
      tier: DataTier.MEASURED,
      activityValue: units,
      unit: 'unit',
      emissions: 0,
      inputs: r,
      note: 'Inventory only — no per-unit refrigerant leakage factor in the reference set.',
    }
  },
}

// ------------------------------------------------------------
// COMMUTE — Scope 3 (core, usually largest)
// ------------------------------------------------------------
function commuteFactor(mode: CommuteMode): number {
  const key = COMMUTE_FACTOR_KEY[mode] ?? 'commuteCar'
  return F[key].value
}

const commute: CategoryProcessor = {
  category: ActivityCategory.COMMUTE,
  resolve(raw, ctx): CategoryResolution {
    const c = (raw || {}) as CommuteInput
    const schoolDays = D.schoolDaysPerYear
    let tier: DataTier
    let passengerKm = 0
    let emissions = 0

    if (Array.isArray(c.modes) && c.modes.length > 0) {
      // Tier 1 — per-mode shares + distances
      tier = DataTier.MEASURED
      for (const m of c.modes) {
        const studentsOnMode = ctx.enrollment * (num(m.pct) / 100)
        const pkm = studentsOnMode * num(m.oneWayKm) * 2 * schoolDays // round trip
        passengerKm += pkm
        emissions += pkm * commuteFactor(m.mode)
      }
    } else if (filled(c.dominantMode) && present(c.avgDistanceKm)) {
      // Tier 2 — single dominant mode + average distance
      tier = DataTier.ESTIMATED
      passengerKm = ctx.enrollment * num(c.avgDistanceKm) * 2 * schoolDays
      emissions = passengerKm * commuteFactor(c.dominantMode as CommuteMode)
    } else {
      // Tier 3 — regional per-student default (already expressed as kg CO2e)
      tier = DataTier.DEFAULT
      emissions = ctx.enrollment * T3.commuteKgPerStudentYear[ctx.areaType]
      return {
        category: ActivityCategory.COMMUTE,
        scope: EmissionScope.SCOPE_3,
        tier,
        activityValue: round(emissions),
        unit: 'kgCO2e (regional default)',
        emissions: round(emissions),
        inputs: c,
        note: 'Regional per-student default — no commute activity data provided.',
      }
    }

    return {
      category: ActivityCategory.COMMUTE,
      scope: EmissionScope.SCOPE_3,
      tier,
      activityValue: round(passengerKm),
      unit: 'passenger-km',
      emissions: round(emissions),
      inputs: c,
    }
  },
}

// ------------------------------------------------------------
// PAPER — Scope 3 (core)
// ------------------------------------------------------------
const paper: CategoryProcessor = {
  category: ActivityCategory.PAPER,
  resolve(raw, ctx): CategoryResolution {
    const p = (raw || {}) as PaperInput
    let kg: number
    let tier: DataTier

    if (present(p.measuredKg)) {
      tier = DataTier.MEASURED
      kg = num(p.measuredKg)
    } else if (present(p.reamsPerMonth)) {
      tier = DataTier.MEASURED
      kg = num(p.reamsPerMonth) * 12 * D.paperKgPerReam
    } else if (ctx.enrollment > 0) {
      tier = DataTier.ESTIMATED // proxy: per-student average × enrollment
      kg = ctx.enrollment * D.paperKgPerStudentYear
    } else {
      tier = DataTier.DEFAULT
      kg = 0
    }

    return {
      category: ActivityCategory.PAPER,
      scope: EmissionScope.SCOPE_3,
      tier,
      activityValue: round(kg),
      unit: F.paper.unit,
      emissions: round(kg * F.paper.value),
      inputs: p,
    }
  },
}

// ------------------------------------------------------------
// FOOD — Scope 3 (optional, hostel/canteen)
// ------------------------------------------------------------
const food: CategoryProcessor = {
  category: ActivityCategory.FOOD,
  resolve(raw, ctx): CategoryResolution | null {
    const f = (raw || {}) as FoodInput
    if (f.hasCanteen === false) return null // no hostel → zero (spec section 4E)

    let meals: number
    let emissions: number
    let tier: DataTier

    const veg = num(f.vegMealsPerYear)
    const mixed = num(f.mixedMealsPerYear)
    const snacks = num(f.snacksPerYear)

    if (present(f.vegMealsPerYear) || present(f.mixedMealsPerYear) || present(f.snacksPerYear)) {
      // Tier 1 — finer split by meal type (each its own factor).
      tier = DataTier.MEASURED
      meals = veg + mixed + snacks
      emissions = veg * F.food.value + mixed * F.foodMixedMeat.value + snacks * F.foodSnack.value
    } else if (present(f.measuredMealsPerYear)) {
      tier = DataTier.MEASURED
      meals = num(f.measuredMealsPerYear)
      emissions = meals * F.food.value
    } else if (present(f.mealsPerDay)) {
      tier = DataTier.ESTIMATED
      meals = num(f.mealsPerDay) * D.foodServingDaysPerYear
      emissions = meals * F.food.value
    } else if (f.hasCanteen) {
      tier = DataTier.DEFAULT
      meals = ctx.enrollment * T3.mealsPerStudentYear
      emissions = meals * F.food.value
    } else {
      return null
    }

    if (meals <= 0) return null
    return {
      category: ActivityCategory.FOOD,
      scope: EmissionScope.SCOPE_3,
      tier,
      activityValue: round(meals),
      unit: F.food.unit,
      emissions: round(emissions),
      inputs: f,
    }
  },
}

// ------------------------------------------------------------
// WASTE — Scope 3 (core)
// ------------------------------------------------------------
const waste: CategoryProcessor = {
  category: ActivityCategory.WASTE,
  resolve(raw, ctx): CategoryResolution {
    const w = (raw || {}) as WasteInput
    let annualKg: number
    let tier: DataTier

    if (present(w.measuredKgPerYear)) {
      tier = DataTier.MEASURED
      annualKg = num(w.measuredKgPerYear)
    } else if (present(w.measuredKgPerWeek)) {
      tier = DataTier.MEASURED
      annualKg = num(w.measuredKgPerWeek) * D.academicWeeksPerYear
    } else if (ctx.enrollment > 0) {
      tier = DataTier.ESTIMATED
      annualKg = ctx.enrollment * D.wasteKgPerStudentYear
    } else {
      tier = DataTier.DEFAULT
      annualKg = T3.wasteKgPerStudentYear
    }

    // Preferred path: explicit treatment split (% to each destination).
    // Each fraction is charged with its own factor (landfill / open burning /
    // composting / recycling). Percentages are normalised if they don't sum 100.
    const tr = w.treatment
    const trTotal = tr
      ? num(tr.landfill) + num(tr.burning) + num(tr.composting) + num(tr.recycling)
      : 0
    if (tr && trTotal > 0) {
      const f = (p: number) => (num(p) / trTotal) * annualKg // kg to each stream
      const landfillKg = f(tr.landfill)
      const burningKg = f(tr.burning)
      const compostKg = f(tr.composting)
      // Recycling is treated as diverted (≈0 process emissions here).
      const emissions =
        landfillKg * F.waste.value +
        burningKg * F.wasteOpenBurning.value +
        compostKg * F.wasteComposting.value
      return {
        category: ActivityCategory.WASTE,
        scope: EmissionScope.SCOPE_3,
        tier,
        activityValue: round(annualKg),
        unit: F.waste.unit,
        emissions: round(emissions),
        inputs: { ...w, treatmentKg: { landfillKg: round(landfillKg), burningKg: round(burningKg), compostKg: round(compostKg) } },
      }
    }

    // Fallback: segregation/diversion practices reduce the landfilled fraction.
    let landfillRate = WASTE_LANDFILL_RATE[w.segregation ?? 'none'] ?? 1.0
    if (w.composting) landfillRate *= 0.8
    if (w.recycling) landfillRate *= 0.85
    const landfillKg = annualKg * landfillRate

    return {
      category: ActivityCategory.WASTE,
      scope: EmissionScope.SCOPE_3,
      tier,
      activityValue: round(landfillKg),
      unit: F.waste.unit,
      emissions: round(landfillKg * F.waste.value),
      inputs: { ...w, effectiveLandfillRate: round(landfillRate) },
    }
  },
}

// ------------------------------------------------------------
// WATER — Scope 3 (optional, minor).
//   Gravity-fed supply ≈ 0; pumped (municipal/borewell) uses the UKWIR
//   per-litre proxy. Litres come from a meter read (Tier 1) or are derived
//   from a bill via a configurable tariff (Tier 2).
// ------------------------------------------------------------
const WATER_CATEGORY = 'WATER' as ActivityCategory
const water: CategoryProcessor = {
  category: WATER_CATEGORY,
  resolve(raw): CategoryResolution | null {
    const w = (raw || {}) as WaterInput
    let litres: number
    let tier: DataTier

    if (present(w.litresPerYear)) {
      tier = DataTier.MEASURED
      litres = num(w.litresPerYear)
    } else if (present(w.billNprPerYear)) {
      tier = DataTier.ESTIMATED
      litres = num(w.billNprPerYear) * D.waterLitresPerNpr
    } else {
      return null // no water data → genuine zero (minor category)
    }

    // Gravity-fed supply has no pumping emission.
    const factor = w.source === 'gravity' ? F.waterGravity.value : F.waterPumped.value
    return {
      category: WATER_CATEGORY,
      scope: EmissionScope.SCOPE_3,
      tier,
      activityValue: round(litres),
      unit: F.waterPumped.unit,
      emissions: round(litres * factor),
      inputs: w,
    }
  },
}

// ------------------------------------------------------------
// REGISTRY — maps a CategoryInputs key to its processor.
// Add a new category by adding one processor here. Nothing else
// in the engine needs to change.
// ------------------------------------------------------------
export const CATEGORY_PROCESSORS: Record<string, CategoryProcessor> = {
  electricity,
  generator,
  vehicle,
  cooking,
  refrigerant,
  commute,
  paper,
  food,
  waste,
  water,
}
