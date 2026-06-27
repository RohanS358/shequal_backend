"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_PROCESSORS = void 0;
const client_1 = require("@prisma/client");
const emission_factors_config_1 = require("../config/emission-factors.config");
const present = (v) => v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v));
const filled = (v) => v !== undefined && v !== null && v !== '';
const num = (v) => (present(v) ? Number(v) : 0);
const round = (v) => Math.round(v * 100) / 100;
const COMMUTE_FACTOR_KEY = {
    walk: 'commuteWalk',
    bicycle: 'commuteBicycle',
    schoolBus: 'commuteSchoolBus',
    publicBus: 'commutePublicBus',
    motorbike: 'commuteMotorbike',
    car: 'commuteCar',
};
const WASTE_LANDFILL_RATE = {
    none: 1.0,
    two: 0.7,
    three: 0.5,
    full: 0.3,
};
const electricity = {
    category: client_1.ActivityCategory.ELECTRICITY,
    resolve(raw, ctx) {
        const e = (raw || {});
        let kWh;
        let tier;
        if (present(e.measuredKwh)) {
            tier = e.estimatedFromBill ? client_1.DataTier.ESTIMATED : client_1.DataTier.MEASURED;
            kWh = num(e.measuredKwh);
        }
        else if (present(e.proxyHoursPerDay) && present(e.proxyRooms)) {
            tier = client_1.DataTier.ESTIMATED;
            const watts = present(e.proxyWattsPerRoom)
                ? num(e.proxyWattsPerRoom)
                : emission_factors_config_1.DERIVATION_CONSTANTS.defaultWattsPerRoom;
            kWh =
                num(e.proxyHoursPerDay) *
                    num(e.proxyRooms) *
                    (watts / 1000) *
                    emission_factors_config_1.DERIVATION_CONSTANTS.schoolDaysPerYear;
        }
        else {
            tier = client_1.DataTier.DEFAULT;
            kWh = emission_factors_config_1.TIER3_DEFAULTS.electricityKwhPerStudentYear[ctx.areaType] * ctx.enrollment;
        }
        const solarKwh = present(e.solarAnnualKwh)
            ? num(e.solarAnnualKwh)
            : num(e.solarKwp) * emission_factors_config_1.DERIVATION_CONSTANTS.solarCapacityFactor * emission_factors_config_1.DERIVATION_CONSTANTS.hoursPerYear;
        const netKwh = Math.max(0, kWh - solarKwh);
        const emissions = netKwh * emission_factors_config_1.EMISSION_FACTORS.gridElectricity.value;
        return {
            category: client_1.ActivityCategory.ELECTRICITY,
            scope: client_1.EmissionScope.SCOPE_2,
            tier,
            activityValue: round(netKwh),
            unit: emission_factors_config_1.EMISSION_FACTORS.gridElectricity.unit,
            emissions: round(emissions),
            inputs: e,
        };
    },
};
const generator = {
    category: client_1.ActivityCategory.GENERATOR_FUEL,
    resolve(raw, ctx) {
        const g = (raw || {});
        let litres;
        let tier;
        if (present(g.measuredLitres)) {
            tier = client_1.DataTier.MEASURED;
            litres = num(g.measuredLitres);
        }
        else if (present(g.proxyHoursPerDay) && present(g.proxyKva)) {
            tier = client_1.DataTier.ESTIMATED;
            const days = present(g.proxyDaysPerYear)
                ? num(g.proxyDaysPerYear)
                : emission_factors_config_1.DERIVATION_CONSTANTS.schoolDaysPerYear;
            litres =
                num(g.proxyHoursPerDay) *
                    num(g.proxyKva) *
                    emission_factors_config_1.DERIVATION_CONSTANTS.generatorLitresPerKvaHour *
                    days;
        }
        else if (g.hasGenerator) {
            tier = client_1.DataTier.DEFAULT;
            litres = emission_factors_config_1.TIER3_DEFAULTS.generatorLitresPerStudentYear[ctx.areaType] * ctx.enrollment;
        }
        else {
            return null;
        }
        const emissions = litres * emission_factors_config_1.EMISSION_FACTORS.dieselCombustion.value;
        return {
            category: client_1.ActivityCategory.GENERATOR_FUEL,
            scope: client_1.EmissionScope.SCOPE_1,
            tier,
            activityValue: round(litres),
            unit: emission_factors_config_1.EMISSION_FACTORS.dieselCombustion.unit,
            emissions: round(emissions),
            inputs: g,
        };
    },
};
const vehicle = {
    category: client_1.ActivityCategory.VEHICLE_FUEL,
    resolve(raw) {
        const v = (raw || {});
        let diesel = num(v.dieselLitres);
        let petrol = num(v.petrolLitres);
        if (present(v.measuredLitres)) {
            if (v.fuelType === 'petrol')
                petrol += num(v.measuredLitres);
            else
                diesel += num(v.measuredLitres);
        }
        if (diesel <= 0 && petrol <= 0)
            return null;
        const litres = diesel + petrol;
        const emissions = diesel * emission_factors_config_1.EMISSION_FACTORS.dieselCombustion.value + petrol * emission_factors_config_1.EMISSION_FACTORS.petrolCombustion.value;
        return {
            category: client_1.ActivityCategory.VEHICLE_FUEL,
            scope: client_1.EmissionScope.SCOPE_1,
            tier: client_1.DataTier.MEASURED,
            activityValue: round(litres),
            unit: emission_factors_config_1.EMISSION_FACTORS.dieselCombustion.unit,
            emissions: round(emissions),
            inputs: v,
            note: 'School-owned fleet; diesel + petrol combined (see inputs for the split).',
        };
    },
};
const cooking = {
    category: client_1.ActivityCategory.COOKING_FUEL,
    resolve(raw) {
        const c = (raw || {});
        if (!present(c.lpgLitres) && !present(c.lpgKg) && !present(c.firewoodKg) && !present(c.charcoalKg))
            return null;
        const lpgLitres = present(c.lpgLitres) ? num(c.lpgLitres) : num(c.lpgKg) / emission_factors_config_1.DERIVATION_CONSTANTS.lpgKgPerLitre;
        const wood = num(c.firewoodKg);
        const charcoal = num(c.charcoalKg);
        const emissions = lpgLitres * emission_factors_config_1.EMISSION_FACTORS.lpg.value + wood * emission_factors_config_1.EMISSION_FACTORS.firewood.value + charcoal * emission_factors_config_1.EMISSION_FACTORS.charcoal.value;
        const lpgKgEquiv = lpgLitres * emission_factors_config_1.DERIVATION_CONSTANTS.lpgKgPerLitre;
        return {
            category: client_1.ActivityCategory.COOKING_FUEL,
            scope: client_1.EmissionScope.SCOPE_1,
            tier: client_1.DataTier.MEASURED,
            activityValue: round(lpgKgEquiv + wood + charcoal),
            unit: 'kg',
            emissions: round(emissions),
            inputs: { ...c, lpgLitres: round(lpgLitres) },
            note: 'LPG (litres) + firewood + charcoal combined; see inputs for the split.',
        };
    },
};
const refrigerant = {
    category: client_1.ActivityCategory.REFRIGERANT,
    resolve(raw) {
        const r = (raw || {});
        const units = num(r.acUnits) + num(r.refrigerators) + num(r.waterCoolers);
        if (units <= 0)
            return null;
        return {
            category: client_1.ActivityCategory.REFRIGERANT,
            scope: client_1.EmissionScope.SCOPE_1,
            tier: client_1.DataTier.MEASURED,
            activityValue: units,
            unit: 'unit',
            emissions: 0,
            inputs: r,
            note: 'Inventory only — no per-unit refrigerant leakage factor in the reference set.',
        };
    },
};
function commuteFactor(mode) {
    const key = COMMUTE_FACTOR_KEY[mode] ?? 'commuteCar';
    return emission_factors_config_1.EMISSION_FACTORS[key].value;
}
const commute = {
    category: client_1.ActivityCategory.COMMUTE,
    resolve(raw, ctx) {
        const c = (raw || {});
        const schoolDays = emission_factors_config_1.DERIVATION_CONSTANTS.schoolDaysPerYear;
        let tier;
        let passengerKm = 0;
        let emissions = 0;
        if (Array.isArray(c.modes) && c.modes.length > 0) {
            tier = client_1.DataTier.MEASURED;
            for (const m of c.modes) {
                const studentsOnMode = ctx.enrollment * (num(m.pct) / 100);
                const pkm = studentsOnMode * num(m.oneWayKm) * 2 * schoolDays;
                passengerKm += pkm;
                emissions += pkm * commuteFactor(m.mode);
            }
        }
        else if (filled(c.dominantMode) && present(c.avgDistanceKm)) {
            tier = client_1.DataTier.ESTIMATED;
            passengerKm = ctx.enrollment * num(c.avgDistanceKm) * 2 * schoolDays;
            emissions = passengerKm * commuteFactor(c.dominantMode);
        }
        else {
            tier = client_1.DataTier.DEFAULT;
            emissions = ctx.enrollment * emission_factors_config_1.TIER3_DEFAULTS.commuteKgPerStudentYear[ctx.areaType];
            return {
                category: client_1.ActivityCategory.COMMUTE,
                scope: client_1.EmissionScope.SCOPE_3,
                tier,
                activityValue: round(emissions),
                unit: 'kgCO2e (regional default)',
                emissions: round(emissions),
                inputs: c,
                note: 'Regional per-student default — no commute activity data provided.',
            };
        }
        return {
            category: client_1.ActivityCategory.COMMUTE,
            scope: client_1.EmissionScope.SCOPE_3,
            tier,
            activityValue: round(passengerKm),
            unit: 'passenger-km',
            emissions: round(emissions),
            inputs: c,
        };
    },
};
const paper = {
    category: client_1.ActivityCategory.PAPER,
    resolve(raw, ctx) {
        const p = (raw || {});
        let kg;
        let tier;
        if (present(p.measuredKg)) {
            tier = client_1.DataTier.MEASURED;
            kg = num(p.measuredKg);
        }
        else if (present(p.reamsPerMonth)) {
            tier = client_1.DataTier.MEASURED;
            kg = num(p.reamsPerMonth) * 12 * emission_factors_config_1.DERIVATION_CONSTANTS.paperKgPerReam;
        }
        else if (ctx.enrollment > 0) {
            tier = client_1.DataTier.ESTIMATED;
            kg = ctx.enrollment * emission_factors_config_1.DERIVATION_CONSTANTS.paperKgPerStudentYear;
        }
        else {
            tier = client_1.DataTier.DEFAULT;
            kg = 0;
        }
        return {
            category: client_1.ActivityCategory.PAPER,
            scope: client_1.EmissionScope.SCOPE_3,
            tier,
            activityValue: round(kg),
            unit: emission_factors_config_1.EMISSION_FACTORS.paper.unit,
            emissions: round(kg * emission_factors_config_1.EMISSION_FACTORS.paper.value),
            inputs: p,
        };
    },
};
const food = {
    category: client_1.ActivityCategory.FOOD,
    resolve(raw, ctx) {
        const f = (raw || {});
        if (f.hasCanteen === false)
            return null;
        let meals;
        let emissions;
        let tier;
        const veg = num(f.vegMealsPerYear);
        const mixed = num(f.mixedMealsPerYear);
        const snacks = num(f.snacksPerYear);
        if (present(f.vegMealsPerYear) || present(f.mixedMealsPerYear) || present(f.snacksPerYear)) {
            tier = client_1.DataTier.MEASURED;
            meals = veg + mixed + snacks;
            emissions = veg * emission_factors_config_1.EMISSION_FACTORS.food.value + mixed * emission_factors_config_1.EMISSION_FACTORS.foodMixedMeat.value + snacks * emission_factors_config_1.EMISSION_FACTORS.foodSnack.value;
        }
        else if (present(f.measuredMealsPerYear)) {
            tier = client_1.DataTier.MEASURED;
            meals = num(f.measuredMealsPerYear);
            emissions = meals * emission_factors_config_1.EMISSION_FACTORS.food.value;
        }
        else if (present(f.mealsPerDay)) {
            tier = client_1.DataTier.ESTIMATED;
            meals = num(f.mealsPerDay) * emission_factors_config_1.DERIVATION_CONSTANTS.foodServingDaysPerYear;
            emissions = meals * emission_factors_config_1.EMISSION_FACTORS.food.value;
        }
        else if (f.hasCanteen) {
            tier = client_1.DataTier.DEFAULT;
            meals = ctx.enrollment * emission_factors_config_1.TIER3_DEFAULTS.mealsPerStudentYear;
            emissions = meals * emission_factors_config_1.EMISSION_FACTORS.food.value;
        }
        else {
            return null;
        }
        if (meals <= 0)
            return null;
        return {
            category: client_1.ActivityCategory.FOOD,
            scope: client_1.EmissionScope.SCOPE_3,
            tier,
            activityValue: round(meals),
            unit: emission_factors_config_1.EMISSION_FACTORS.food.unit,
            emissions: round(emissions),
            inputs: f,
        };
    },
};
const waste = {
    category: client_1.ActivityCategory.WASTE,
    resolve(raw, ctx) {
        const w = (raw || {});
        let annualKg;
        let tier;
        if (present(w.measuredKgPerYear)) {
            tier = client_1.DataTier.MEASURED;
            annualKg = num(w.measuredKgPerYear);
        }
        else if (present(w.measuredKgPerWeek)) {
            tier = client_1.DataTier.MEASURED;
            annualKg = num(w.measuredKgPerWeek) * emission_factors_config_1.DERIVATION_CONSTANTS.academicWeeksPerYear;
        }
        else if (ctx.enrollment > 0) {
            tier = client_1.DataTier.ESTIMATED;
            annualKg = ctx.enrollment * emission_factors_config_1.DERIVATION_CONSTANTS.wasteKgPerStudentYear;
        }
        else {
            tier = client_1.DataTier.DEFAULT;
            annualKg = emission_factors_config_1.TIER3_DEFAULTS.wasteKgPerStudentYear;
        }
        const tr = w.treatment;
        const trTotal = tr
            ? num(tr.landfill) + num(tr.burning) + num(tr.composting) + num(tr.recycling)
            : 0;
        if (tr && trTotal > 0) {
            const f = (p) => (num(p) / trTotal) * annualKg;
            const landfillKg = f(tr.landfill);
            const burningKg = f(tr.burning);
            const compostKg = f(tr.composting);
            const emissions = landfillKg * emission_factors_config_1.EMISSION_FACTORS.waste.value +
                burningKg * emission_factors_config_1.EMISSION_FACTORS.wasteOpenBurning.value +
                compostKg * emission_factors_config_1.EMISSION_FACTORS.wasteComposting.value;
            return {
                category: client_1.ActivityCategory.WASTE,
                scope: client_1.EmissionScope.SCOPE_3,
                tier,
                activityValue: round(annualKg),
                unit: emission_factors_config_1.EMISSION_FACTORS.waste.unit,
                emissions: round(emissions),
                inputs: { ...w, treatmentKg: { landfillKg: round(landfillKg), burningKg: round(burningKg), compostKg: round(compostKg) } },
            };
        }
        let landfillRate = WASTE_LANDFILL_RATE[w.segregation ?? 'none'] ?? 1.0;
        if (w.composting)
            landfillRate *= 0.8;
        if (w.recycling)
            landfillRate *= 0.85;
        const landfillKg = annualKg * landfillRate;
        return {
            category: client_1.ActivityCategory.WASTE,
            scope: client_1.EmissionScope.SCOPE_3,
            tier,
            activityValue: round(landfillKg),
            unit: emission_factors_config_1.EMISSION_FACTORS.waste.unit,
            emissions: round(landfillKg * emission_factors_config_1.EMISSION_FACTORS.waste.value),
            inputs: { ...w, effectiveLandfillRate: round(landfillRate) },
        };
    },
};
const WATER_CATEGORY = 'WATER';
const water = {
    category: WATER_CATEGORY,
    resolve(raw) {
        const w = (raw || {});
        let litres;
        let tier;
        if (present(w.litresPerYear)) {
            tier = client_1.DataTier.MEASURED;
            litres = num(w.litresPerYear);
        }
        else if (present(w.billNprPerYear)) {
            tier = client_1.DataTier.ESTIMATED;
            litres = num(w.billNprPerYear) * emission_factors_config_1.DERIVATION_CONSTANTS.waterLitresPerNpr;
        }
        else {
            return null;
        }
        const factor = w.source === 'gravity' ? emission_factors_config_1.EMISSION_FACTORS.waterGravity.value : emission_factors_config_1.EMISSION_FACTORS.waterPumped.value;
        return {
            category: WATER_CATEGORY,
            scope: client_1.EmissionScope.SCOPE_3,
            tier,
            activityValue: round(litres),
            unit: emission_factors_config_1.EMISSION_FACTORS.waterPumped.unit,
            emissions: round(litres * factor),
            inputs: w,
        };
    },
};
exports.CATEGORY_PROCESSORS = {
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
};
//# sourceMappingURL=category-processors.js.map