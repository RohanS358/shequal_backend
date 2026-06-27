// ============================================================
// EMISSION FACTORS — SINGLE SOURCE OF TRUTH
// ------------------------------------------------------------
// Implements section 5 of the CoPaila Backend Logic Spec:
//   "Each emission factor entry should store the activity type it
//    applies to, the numeric factor value, the unit it's expressed
//    in, the source reference, and the year of publication — because
//    emission factors get updated periodically and you want to be
//    able to swap values without redesigning your schema."
//
// To update a factor in the future, change it HERE ONLY and run a
// recalculation (POST /carbon-audits/:id/recalculate, or the bulk
// admin recalc). Nothing else needs to change.
//
// All factor values are kg CO2e per the stated unit.
// ============================================================

export type EmissionScope = 'scope1' | 'scope2' | 'scope3'

export interface EmissionFactor {
  /** kg CO2e released per 1 unit of activity */
  value: number
  /** the unit `value` is expressed per — kWh, litre, kg, passenger-km, meal, ream, unit */
  unit: string
  /** which GHG Protocol scope this activity belongs to */
  scope: EmissionScope
  /** citation for auditability (UNESCO / future auditors expect this) */
  source: string
  /** publication year of the source */
  year: number
  /** optional human note / caveat */
  note?: string
}

// ------------------------------------------------------------
// MASTER FACTOR TABLE
// Keys are stable identifiers referenced by the calculator engine.
// ------------------------------------------------------------
// Values below reflect the "Updated Emission Factors" reference sheet
// (IPCC 2006 / NEA CDM / DESNZ 2023 / WRI India 2015 / Poore & Nemecek 2018 /
// UKWIR). Each carries its source + year so it can be swapped without touching
// the engine — this object is the ONLY place factor numbers live.
export const EMISSION_FACTORS = {
  // --- Scope 2: purchased electricity ---
  gridElectricity: {
    value: 0.0198,
    unit: 'kWh',
    scope: 'scope2',
    source: 'Nepal Electricity Authority / CDM Baseline Study (cross-validated vs Nepal BUR1 2025, Table 9)',
    year: 2025,
    note: 'Very low — Nepal generation is hydropower-dominant.',
  },

  // --- Scope 1: fuel combustion (IPCC 2006, Vol. 2) ---
  dieselCombustion: {
    value: 2.68,
    unit: 'litre',
    scope: 'scope1',
    source: 'IPCC 2006, Vol. 2, Ch. 2 (Stationary Combustion) — school diesel generators',
    year: 2006,
  },
  petrolCombustion: {
    value: 2.31,
    unit: 'litre',
    scope: 'scope1',
    source: 'IPCC 2006, Vol. 2, Ch. 3 (Mobile Combustion) — school-owned vehicles',
    year: 2006,
  },
  lpg: {
    value: 1.61,
    unit: 'litre',
    scope: 'scope1',
    source: 'IPCC 2006, Vol. 2 — LPG (EF 63,100 kgCO2/TJ × NCV 47.3 MJ/kg × density 0.540 kg/L)',
    year: 2006,
    note: 'Per LITRE. The form collects cylinders → kg; the cooking processor converts kg→litre via DERIVATION_CONSTANTS.lpgKgPerLitre (0.54). Net ≈ 2.98 kgCO2e/kg, the IPCC per-kg basis. (Old table value 2.98 was mislabelled as petrol.)',
  },
  firewood: {
    // Nepal default treats biomass as NON-renewable (deforestation risk);
    // BUR1 2025 tracks biomass CO2 as a significant source.
    value: 1.88,
    unit: 'kg',
    scope: 'scope1',
    source: 'IPCC 2006, Vol. 2 — firewood/biomass full CO2e (CO2 1.747 + CH4@GWP25 + N2O@GWP298, residential)',
    year: 2006,
    note: 'Non-renewable assumption for Nepal. CO2-only would be 1.747; full CO2e incl. CH4/N2O = 1.88.',
  },
  charcoal: {
    value: 3.49,
    unit: 'kg',
    scope: 'scope1',
    source: 'IPCC 2006, Vol. 2 — charcoal full CO2e (EF 112,000 kgCO2/TJ × NCV 29.5 MJ/kg = 3.30 CO2 + CH4/N2O)',
    year: 2006,
    note: 'Corrected from 6.86 (a coal EF applied by mistake) to 3.49 kgCO2e/kg.',
  },

  // --- Scope 3: commuting (per passenger-km) ---
  commuteWalk: {
    value: 0,
    unit: 'passenger-km',
    scope: 'scope3',
    source: 'Walking / cycling — zero operational emissions',
    year: 2023,
  },
  commuteBicycle: {
    value: 0,
    unit: 'passenger-km',
    scope: 'scope3',
    source: 'Walking / cycling — zero operational emissions',
    year: 2023,
  },
  commuteSchoolBus: {
    value: 0.027,
    unit: 'passenger-km',
    scope: 'scope3',
    source: 'UK DESNZ 2023 (adapted for ~40 occupancy) — school bus (full)',
    year: 2023,
  },
  commutePublicBus: {
    value: 0.089,
    unit: 'passenger-km',
    scope: 'scope3',
    source: 'WRI India GHG Program 2015 (adapted) — public microbus / tempo',
    year: 2015,
  },
  commuteMotorbike: {
    value: 0.113,
    unit: 'passenger-km',
    scope: 'scope3',
    source: 'UK DESNZ 2023 GHG Conversion Factors — motorcycle',
    year: 2023,
    note: 'Proxy — no Nepal-specific per-km factor exists. Motorcycles are Nepal’s dominant private vehicle (BUR1 2025).',
  },
  commuteCar: {
    value: 0.171,
    unit: 'passenger-km',
    scope: 'scope3',
    source: 'UK DESNZ 2023 — car / jeep (assumes 1.5 average occupancy)',
    year: 2023,
  },

  // --- Scope 3: paper, food, waste ---
  paper: {
    value: 1.84,
    unit: 'kg',
    scope: 'scope3',
    source: 'EEA & IPCC paper lifecycle estimates — paper / textbooks',
    year: 2018,
  },
  // Food: reference doc lists three meal types. `food` is the default applied to
  // the school form’s meals/day input (Nepal vegetarian dal-bhat baseline);
  // foodMixedMeat / foodSnack are available for finer-grained inputs.
  food: {
    value: 0.9,
    unit: 'meal',
    scope: 'scope3',
    source: 'Poore & Nemecek, Science 2018 (adapted) — dal-bhat (vegetarian), default meal',
    year: 2018,
  },
  foodMixedMeat: {
    value: 1.8,
    unit: 'meal',
    scope: 'scope3',
    source: 'Poore & Nemecek 2018 (adapted) — mixed meal with meat (poultry-dominant)',
    year: 2018,
  },
  foodSnack: {
    value: 0.5,
    unit: 'meal',
    scope: 'scope3',
    source: 'Processed food production literature average — canteen snacks / packaged (low confidence)',
    year: 2018,
    note: 'Low confidence — flag in output.',
  },
  // Waste: base factor is municipal landfill; diversion practices lower the
  // landfilled fraction in the engine. openBurning / composting available too.
  waste: {
    value: 0.467,
    unit: 'kg',
    scope: 'scope3',
    source: 'IPCC 2006, Vol. 5, Ch. 3 (Solid Waste Disposal) — municipal landfill',
    year: 2006,
  },
  wasteOpenBurning: {
    value: 0.689,
    unit: 'kg',
    scope: 'scope3',
    source: 'IPCC 2006, Vol. 5, Ch. 5 (Incineration & Open Burning) — priority reduction target',
    year: 2006,
  },
  wasteComposting: {
    value: 0.01,
    unit: 'kg',
    scope: 'scope3',
    source: 'IPCC 2006, Vol. 5 — composting (effectively negligible)',
    year: 2006,
  },

  // --- Scope 3: water (minor; not yet collected by the form) ---
  waterPumped: {
    value: 0.000344,
    unit: 'litre',
    scope: 'scope3',
    source: 'UK Water Industry Research (UKWIR) proxy — pumped municipal supply',
    year: 2020,
    note: 'No Nepal-specific water utility energy data exists; minor category.',
  },
  waterGravity: {
    value: 0,
    unit: 'litre',
    scope: 'scope3',
    source: 'Gravity-fed supply — zero pumping emission (common in hill schools)',
    year: 2020,
  },
} as const satisfies Record<string, EmissionFactor>

export type EmissionFactorKey = keyof typeof EMISSION_FACTORS

// ------------------------------------------------------------
// GLOBAL WARMING POTENTIALS (100-yr, IPCC AR5) — the same basis used
// in Nepal's BUR1 2025 inventory. The CO2e factors above already bake
// these in; this table is kept for transparency and any future factor
// that needs to convert a raw gas mass to CO2e.
// ------------------------------------------------------------
export const GLOBAL_WARMING_POTENTIALS = {
  CO2: 1,
  CH4: 28,
  N2O: 265,
} as const

// ------------------------------------------------------------
// TIER 2 — DERIVATION CONSTANTS (proxy → activity data)
// Used when a school cannot give a measured value but can answer a
// simpler proxy question (spec section 3, Tier 2 "yellow flag").
// ------------------------------------------------------------
export const DERIVATION_CONSTANTS = {
  /** Diesel litres consumed per kVA of rated capacity per running hour. */
  generatorLitresPerKvaHour: 0.25,
  /** Fallback wattage per electrified room if the school can't estimate it. */
  defaultWattsPerRoom: 200,
  /** Litres per ream (A4, 80gsm, 500 sheets ≈ 2.5 kg). */
  paperKgPerReam: 2.5,

  /** LPG density (kg per litre) — converts cylinder/kg input to litres so the
   *  per-litre LPG factor (1.61) applies. 14.2 kg cylinder ≈ 26.3 L. */
  lpgKgPerLitre: 0.54,

  /** Water bill → litres proxy (litres per NPR). Low-confidence; tune to the
   *  local utility tariff. Only used when a school gives a bill, not a meter read. */
  waterLitresPerNpr: 33.3,

  /** Calendar constants. */
  hoursPerYear: 8760,
  schoolDaysPerYear: 200,
  academicWeeksPerYear: 40,

  /** Solar: capacity factor for Nepal (~1750 peak-sun-hours/yr). */
  solarCapacityFactor: 0.2,

  /** Tier 2 paper proxy: kg of paper per enrolled student per year. */
  paperKgPerStudentYear: 5,
  /** Tier 2 waste proxy: kg of waste per enrolled student per year. */
  wasteKgPerStudentYear: 20,
  /** Tier 2 food proxy: meals per serving-day used with mealsPerDay input. */
  foodServingDaysPerYear: 200,
} as const

// ------------------------------------------------------------
// TIER 3 — NATIONAL/REGIONAL DEFAULTS ("red flag" fallbacks)
// Applied silently when a school gives neither measured nor proxy
// data (spec sections 3 & 9). Keyed by area type where the spec says
// urban/rural materially changes the estimate.
//
// NOTE: these are placeholder national averages — calibrate against
// the HiJASE 2025 baseline / NEA data before production use.
// ------------------------------------------------------------
export type AreaTypeKey = 'URBAN' | 'PERI_URBAN' | 'RURAL'

export const TIER3_DEFAULTS = {
  /** Grid electricity, kWh per student per year, by area type. */
  electricityKwhPerStudentYear: {
    URBAN: 60,
    PERI_URBAN: 40,
    RURAL: 20,
  } as Record<AreaTypeKey, number>,

  /** Generator diesel, litres per student per year (area-driven load-shedding). */
  generatorLitresPerStudentYear: {
    URBAN: 2,
    PERI_URBAN: 3,
    RURAL: 4,
  } as Record<AreaTypeKey, number>,

  /**
   * Commuting, kg CO2e per student per year, by area type.
   * Urban: shorter distance but higher private-vehicle share.
   * Rural: longer distance but higher walking/public-transport share.
   */
  commuteKgPerStudentYear: {
    URBAN: 120,
    PERI_URBAN: 95,
    RURAL: 70,
  } as Record<AreaTypeKey, number>,

  /** Paper, kg per student per year. */
  paperKgPerStudentYear: 5,
  /** Waste, kg per student per year. */
  wasteKgPerStudentYear: 20,
  /** Meals served per student per year (0 when no hostel/canteen). */
  mealsPerStudentYear: 0,
} as const
