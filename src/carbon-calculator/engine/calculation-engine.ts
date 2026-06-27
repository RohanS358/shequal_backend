// ============================================================
// CALCULATION ENGINE  (spec section 7 — step by step)
// Pure functions: take resolved category inputs + context, return a
// full result (scopes, per-student intensity, confidence, grade,
// recommendations). No DB, no DI — trivially unit-testable.
// ============================================================
import { ActivityCategory, DataTier } from '@prisma/client'
import { CATEGORY_PROCESSORS } from './category-processors'
import { EMISSION_FACTORS as F } from '../config/emission-factors.config'
import {
  AuditContext,
  CalculationResult,
  CategoryInputs,
  CategoryResolution,
} from './types'

const round = (v: number): number => Math.round(v * 100) / 100

const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D']

// Tier confidence weights — Tier 1 fully trusted, Tier 3 barely.
const TIER_WEIGHT: Record<DataTier, number> = {
  MEASURED: 1.0,
  ESTIMATED: 0.6,
  DEFAULT: 0.2,
}

export function runCalculation(
  inputs: CategoryInputs,
  ctx: AuditContext,
): CalculationResult {
  // Steps 1-3: resolve every category to a line item (activity × factor).
  const resolutions: CategoryResolution[] = []
  for (const [key, processor] of Object.entries(CATEGORY_PROCESSORS)) {
    const res = processor.resolve((inputs as Record<string, unknown>)[key], ctx)
    if (res) resolutions.push(res)
  }

  // Step 4: sum by scope.
  const sumScope = (scope: string) =>
    resolutions
      .filter((r) => r.scope === scope)
      .reduce((s, r) => s + r.emissions, 0)
  const scope1 = round(sumScope('SCOPE_1'))
  const scope2 = round(sumScope('SCOPE_2'))
  const scope3 = round(sumScope('SCOPE_3'))

  // Step 5: total.
  const total = round(scope1 + scope2 + scope3)

  // Step 6: per-student intensity.
  const emissionsPerStudent =
    ctx.enrollment > 0 ? round(total / ctx.enrollment) : null

  // Step 7: confidence — % of total EMISSIONS value from each tier.
  const tierEmissions: Record<DataTier, number> = {
    MEASURED: 0,
    ESTIMATED: 0,
    DEFAULT: 0,
  }
  for (const r of resolutions) tierEmissions[r.tier] += r.emissions

  const pct = (v: number) => (total > 0 ? round((v / total) * 100) : 0)
  const tier1Pct = pct(tierEmissions.MEASURED)
  const tier2Pct = pct(tierEmissions.ESTIMATED)
  const tier3Pct = pct(tierEmissions.DEFAULT)

  const confidenceScore =
    total > 0
      ? round(
          tier1Pct * TIER_WEIGHT.MEASURED +
            tier2Pct * TIER_WEIGHT.ESTIMATED +
            tier3Pct * TIER_WEIGHT.DEFAULT,
        )
      : 0

  // A category fell back to a Tier-3 default and it contributes emissions.
  const partiallyDefault = resolutions.some(
    (r) => r.tier === DataTier.DEFAULT && r.emissions > 0,
  )

  // Step 8: grade — intensity AND data quality (never intensity alone).
  const grade = computeGrade(emissionsPerStudent, confidenceScore)

  // Breakdown JSON keyed by category.
  const breakdown: Record<string, unknown> = {}
  for (const r of resolutions) {
    breakdown[r.category] = {
      emissions: r.emissions,
      activityValue: r.activityValue,
      unit: r.unit,
      tier: r.tier,
      scope: r.scope,
    }
  }

  const recommendations = generateRecommendations(resolutions, {
    scope1,
    scope2,
    scope3,
    total,
  })

  return {
    scope1Emissions: scope1,
    scope2Emissions: scope2,
    scope3Emissions: scope3,
    totalEmissions: total,
    emissionsPerStudent,
    tier1Pct,
    tier2Pct,
    tier3Pct,
    confidenceScore,
    partiallyDefault,
    grade,
    breakdown,
    recommendations,
    resolutions,
  }
}

// ------------------------------------------------------------
// GRADING — combine emission intensity with data quality.
// A school running mostly on Tier-3 defaults can never score top
// marks (spec step 8: prevents no-data schools ranking well by luck).
// ------------------------------------------------------------
function computeGrade(
  perStudent: number | null,
  confidence: number,
): string | null {
  if (perStudent === null) return null

  // Intensity → base grade index (kg CO2e / student / year).
  let idx: number
  if (perStudent < 50) idx = 0 // A+
  else if (perStudent < 100) idx = 1 // A
  else if (perStudent < 200) idx = 2 // B+
  else if (perStudent < 350) idx = 3 // B
  else if (perStudent < 500) idx = 4 // C+
  else if (perStudent < 700) idx = 5 // C
  else idx = 6 // D

  // Data-quality penalty.
  if (confidence < 40)
    idx = Math.max(idx, 4) // mostly default → no better than C+
  else if (confidence < 60) idx = Math.min(idx + 1, GRADES.length - 1)

  return GRADES[idx]
}

// ------------------------------------------------------------
// RECOMMENDATIONS — rule-based, driven by the actual resolved line items.
// Each rule reads the category emissions (and, where useful, the underlying
// inputs — fuel mix, commute modes, meal split, waste treatment) so the
// advice and the estimated saving reflect THIS school's data, not a template.
// Output is sorted biggest-impact-first and each item carries enough metadata
// (category, scope, effort, timeframe, priority) for a rich UI.
// ------------------------------------------------------------
type Priority = 'High' | 'Medium' | 'Low'
interface Recommendation {
  ruleKey?: string // stable id → DB-editable display content (recommendations table)
  icon: string
  category: 'Energy' | 'Fuel' | 'Transport' | 'Food' | 'Waste' | 'Paper' | 'Water'
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'
  effort: 1 | 2 | 3
  timeframe: string
  title: string
  text: string
  potentialReductionKg: number
  priority: Priority
}

function generateRecommendations(
  resolutions: CategoryResolution[],
  scopes: { scope1: number; scope2: number; scope3: number; total: number },
): Recommendation[] {
  const total = scopes.total
  if (total <= 0) return []

  const byCategory = new Map<ActivityCategory, CategoryResolution>()
  for (const r of resolutions) byCategory.set(r.category, r)
  const get = (c: ActivityCategory) => byCategory.get(c)
  const emOf = (c: ActivityCategory) => get(c)?.emissions ?? 0
  const inputsOf = (c: ActivityCategory) =>
    (get(c)?.inputs ?? {}) as Record<string, unknown>

  const recs: Recommendation[] = []
  // Priority is derived from how much of the TOTAL footprint a measure can cut.
  const priorityFor = (kg: number): Priority => {
    const share = kg / total
    if (share >= 0.05) return 'High'
    if (share >= 0.015) return 'Medium'
    return 'Low'
  }
  const add = (r: Omit<Recommendation, 'priority' | 'potentialReductionKg'> & {
    potentialReductionKg: number
    priority?: Priority
  }) => {
    const kg = Math.max(0, Math.round(r.potentialReductionKg || 0))
    if (kg <= 0) return // no measurable benefit for this school → skip
    recs.push({ ...r, potentialReductionKg: kg, priority: r.priority ?? priorityFor(kg) })
  }
  const numOf = (v: unknown) => Number(v) || 0

  // ── Electricity (Scope 2) ──
  const elec = emOf(ActivityCategory.ELECTRICITY)
  const elecIn = inputsOf(ActivityCategory.ELECTRICITY)
  const hasSolar = numOf(elecIn.solarKwp) > 0 || numOf(elecIn.solarAnnualKwh) > 0
  if (elec > 0) {
    add({ icon: '💡', category: 'Energy', scope: 'SCOPE_2', effort: 1, timeframe: 'This week',
      title: 'Switch to LED Lighting',
      text: 'Replace fluorescent and incandescent bulbs with LEDs across classrooms and corridors — LEDs use 35–40% less electricity and last far longer.',
      potentialReductionKg: elec * 0.35 })
    add({ icon: '🕒', category: 'Energy', scope: 'SCOPE_2', effort: 1, timeframe: 'This week',
      title: 'Lights-Off & Timer Policy',
      text: 'Enforce a "last one out, lights off" rule and fit timer switches in corridors, toilets and common areas to stop daytime and standby waste.',
      potentialReductionKg: elec * 0.1 })
    add({ icon: '🧱', category: 'Energy', scope: 'SCOPE_2', effort: 2, timeframe: 'This term',
      title: 'Insulate & Seal Classrooms',
      text: 'Insulate roofs/ceilings and seal window and door gaps so rooms hold heat in winter, cutting heating and electricity demand by 10–15%.',
      potentialReductionKg: elec * 0.12 })
    if (!hasSolar)
      add({ icon: '☀️', category: 'Energy', scope: 'SCOPE_2', effort: 3, timeframe: 'This year',
        title: 'Install Rooftop Solar',
        text: 'Nepal gets ~300 sunny days a year. A rooftop solar array can offset 30–50% of daytime grid use, qualifies for NEA net-metering and typically pays back in ~6 years.',
        potentialReductionKg: elec * 0.4 })
  }

  // ── Cooking fuel (Scope 1) — target the dirtiest fuel in the mix ──
  const cookIn = inputsOf(ActivityCategory.COOKING_FUEL)
  const charcoalEm = numOf(cookIn.charcoalKg) * F.charcoal.value
  const firewoodEm = numOf(cookIn.firewoodKg) * F.firewood.value
  if (charcoalEm > 0)
    add({ icon: '🔥', category: 'Fuel', scope: 'SCOPE_1', effort: 2, timeframe: 'This term',
      title: 'Replace Charcoal with LPG or Induction',
      text: 'Charcoal is the most carbon-intensive fuel in your kitchen (3.49 kg CO₂e/kg). Switching canteen cooking to LPG or electric induction roughly halves those emissions and clears kitchen smoke.',
      potentialReductionKg: charcoalEm * 0.45 })
  if (firewoodEm > 0)
    add({ icon: '🪵', category: 'Fuel', scope: 'SCOPE_1', effort: 2, timeframe: 'This term',
      title: 'Move to Improved Cookstoves or Biogas',
      text: 'High-efficiency cookstoves or a biogas digester cut firewood use by 30–50%, reduce indoor smoke and ease pressure on local forests.',
      potentialReductionKg: firewoodEm * 0.35 })

  // ── Generator & owned vehicles (Scope 1) ──
  const generator = emOf(ActivityCategory.GENERATOR_FUEL)
  if (generator > 0)
    add({ icon: '🔌', category: 'Fuel', scope: 'SCOPE_1', effort: 2, timeframe: 'This term',
      title: 'Cut Diesel Generator Reliance',
      text: 'Service the generator, schedule heavy loads off-peak, and pair it with solar + battery so the genset only covers genuine outages — usually 20–30% less diesel.',
      potentialReductionKg: generator * 0.25 })
  const vehicle = emOf(ActivityCategory.VEHICLE_FUEL)
  if (vehicle > 0)
    add({ icon: '🚐', category: 'Transport', scope: 'SCOPE_1', effort: 2, timeframe: 'This term',
      title: 'Optimise the School Fleet',
      text: 'Regular servicing, correct tyre pressure, route planning and driver eco-training cut fleet fuel use by ~15%. Consider electric vehicles for short urban runs.',
      potentialReductionKg: vehicle * 0.15 })

  // ── Commuting (Scope 3) — data-aware when mode shares are known ──
  const commute = get(ActivityCategory.COMMUTE)
  const commuteEm = commute?.emissions ?? 0
  const modes = Array.isArray((commute?.inputs as { modes?: unknown[] })?.modes)
    ? ((commute!.inputs as { modes: { mode: string; pct: number }[] }).modes)
    : []
  if (commuteEm > 0) {
    let privateShare = 0
    for (const m of modes) if (m.mode === 'car' || m.mode === 'motorbike') privateShare += numOf(m.pct)
    if (modes.length > 0 && privateShare > 0) {
      add({ icon: '🚌', category: 'Transport', scope: 'SCOPE_3', effort: 2, timeframe: 'This term',
        title: 'Shift Car & Motorbike Commuters to the School Bus',
        text: `Around ${Math.round(privateShare)}% of students arrive by private car or motorbike — your highest-emitting commute modes. Expanding the school-bus route or a parent carpool board moves them onto far cleaner shared transport.`,
        potentialReductionKg: commuteEm * Math.min(0.3, (privateShare / 100) * 0.4) })
    } else {
      add({ icon: '🚲', category: 'Transport', scope: 'SCOPE_3', effort: 1, timeframe: 'This week',
        title: 'Promote Walking, Cycling & Carpooling',
        text: 'Active-travel days, secure bicycle parking and a carpool board for nearby families can trim commute emissions by 10–20%.',
        potentialReductionKg: commuteEm * 0.12 })
    }
  }

  // ── Food / canteen (Scope 3) — plant-based shift is the lever ──
  const food = get(ActivityCategory.FOOD)
  const foodEm = food?.emissions ?? 0
  const mixedEm = numOf((food?.inputs as { mixedMealsPerYear?: number })?.mixedMealsPerYear) * F.foodMixedMeat.value
  if (mixedEm > 0)
    add({ icon: '🥗', category: 'Food', scope: 'SCOPE_3', effort: 1, timeframe: 'This week',
      title: 'Add More Plant-Based Meal Days',
      text: 'A meat meal (1.8 kg CO₂e) emits twice as much as dal-bhat (0.9 kg). Introducing 1–2 extra vegetarian days a week noticeably cuts canteen emissions at no extra cost.',
      potentialReductionKg: mixedEm * 0.3 })
  else if (foodEm > 0)
    add({ icon: '🍽️', category: 'Food', scope: 'SCOPE_3', effort: 1, timeframe: 'This week',
      title: 'Cut Canteen Food Waste',
      text: 'Portion planning, pre-counts and composting leftovers can trim ~10% of food-related emissions and reduce procurement cost.',
      potentialReductionKg: foodEm * 0.1 })

  // ── Waste (Scope 3) — open burning first, then divert from landfill ──
  const waste = get(ActivityCategory.WASTE)
  const wasteEm = waste?.emissions ?? 0
  const wIn = (waste?.inputs ?? {}) as {
    composting?: boolean
    recycling?: boolean
    treatmentKg?: { burningKg?: number }
  }
  const burnEm = numOf(wIn.treatmentKg?.burningKg) * F.wasteOpenBurning.value
  if (burnEm > 0)
    add({ icon: '🚭', category: 'Waste', scope: 'SCOPE_3', effort: 1, timeframe: 'This week', priority: 'High',
      title: 'Stop Open Burning of Waste',
      text: 'Open burning is your dirtiest disposal route (0.689 kg CO₂e/kg) and releases toxic smoke on campus. Diverting it to segregated collection or composting is the single biggest waste win.',
      potentialReductionKg: burnEm * 0.6 })
  if (wasteEm > 0 && !wIn.composting)
    add({ icon: '🌱', category: 'Waste', scope: 'SCOPE_3', effort: 2, timeframe: 'This term',
      title: 'Start a Composting Program',
      text: 'A compost station for canteen and garden waste keeps organics out of landfill (cutting methane) and produces free fertiliser for the school garden.',
      potentialReductionKg: wasteEm * 0.2 })
  if (wasteEm > 0 && !wIn.recycling)
    add({ icon: '♻️', category: 'Waste', scope: 'SCOPE_3', effort: 1, timeframe: 'This week',
      title: 'Set Up Dry/Wet Segregation',
      text: 'Two-bin separation plus a tie-up with a local kabadi/recycler diverts ~30% of waste from landfill and can earn a small income.',
      potentialReductionKg: wasteEm * 0.3 })

  // ── Paper (Scope 3) ──
  const paper = emOf(ActivityCategory.PAPER)
  if (paper > 0)
    add({ icon: '📄', category: 'Paper', scope: 'SCOPE_3', effort: 1, timeframe: 'This week',
      title: 'Go Double-Sided & Digital',
      text: 'Default printers to double-sided, move worksheets and notices to a class group/portal, and reuse single-side sheets for rough work — typically 30% less paper.',
      potentialReductionKg: paper * 0.3 })

  // ── Water (Scope 3, minor) — WATER isn't in the Prisma enum yet, so it's
  //    looked up by its string key (matches the processor's cast). ──
  const water = get('WATER' as ActivityCategory)
  const waterEm = water?.emissions ?? 0
  const waterSource = (water?.inputs as { source?: string })?.source
  if (waterEm > 0 && waterSource !== 'gravity')
    add({ icon: '💧', category: 'Water', scope: 'SCOPE_3', effort: 2, timeframe: 'This term',
      title: 'Harvest Rainwater & Fix Leaks',
      text: 'Rainwater harvesting for toilets and gardening, plus fixing leaks and fitting tap aerators, cuts pumped-water energy use by ~20%.',
      potentialReductionKg: waterEm * 0.2 })

  // Tag each rec with a stable ruleKey so the service can swap in DB-editable
  // content (icon/title/text) without touching the computed savings above.
  const TITLE_TO_KEY: Record<string, string> = {
    'Switch to LED Lighting': 'sch_elec_led',
    'Lights-Off & Timer Policy': 'sch_elec_lightsoff',
    'Insulate & Seal Classrooms': 'sch_elec_insulate',
    'Install Rooftop Solar': 'sch_elec_solar',
    'Replace Charcoal with LPG or Induction': 'sch_cook_charcoal',
    'Move to Improved Cookstoves or Biogas': 'sch_cook_firewood',
    'Cut Diesel Generator Reliance': 'sch_generator',
    'Optimise the School Fleet': 'sch_vehicle',
    'Shift Car & Motorbike Commuters to the School Bus': 'sch_commute_private',
    'Promote Walking, Cycling & Carpooling': 'sch_commute_active',
    'Add More Plant-Based Meal Days': 'sch_food_plant',
    'Cut Canteen Food Waste': 'sch_food_waste',
    'Stop Open Burning of Waste': 'sch_waste_burning',
    'Start a Composting Program': 'sch_waste_compost',
    'Set Up Dry/Wet Segregation': 'sch_waste_segregation',
    'Go Double-Sided & Digital': 'sch_paper',
    'Harvest Rainwater & Fix Leaks': 'sch_water',
  }
  for (const r of recs) r.ruleKey = TITLE_TO_KEY[r.title]

  // Biggest measurable win first.
  recs.sort((a, b) => b.potentialReductionKg - a.potentialReductionKg)
  return recs
}
