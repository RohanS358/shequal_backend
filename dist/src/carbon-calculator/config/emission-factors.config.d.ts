export type EmissionScope = 'scope1' | 'scope2' | 'scope3';
export interface EmissionFactor {
    value: number;
    unit: string;
    scope: EmissionScope;
    source: string;
    year: number;
    note?: string;
}
export declare const EMISSION_FACTORS: {
    readonly gridElectricity: {
        readonly value: 0.0198;
        readonly unit: "kWh";
        readonly scope: "scope2";
        readonly source: "Nepal Electricity Authority / CDM Baseline Study (cross-validated vs Nepal BUR1 2025, Table 9)";
        readonly year: 2025;
        readonly note: "Very low — Nepal generation is hydropower-dominant.";
    };
    readonly dieselCombustion: {
        readonly value: 2.68;
        readonly unit: "litre";
        readonly scope: "scope1";
        readonly source: "IPCC 2006, Vol. 2, Ch. 2 (Stationary Combustion) — school diesel generators";
        readonly year: 2006;
    };
    readonly petrolCombustion: {
        readonly value: 2.31;
        readonly unit: "litre";
        readonly scope: "scope1";
        readonly source: "IPCC 2006, Vol. 2, Ch. 3 (Mobile Combustion) — school-owned vehicles";
        readonly year: 2006;
    };
    readonly lpg: {
        readonly value: 1.61;
        readonly unit: "litre";
        readonly scope: "scope1";
        readonly source: "IPCC 2006, Vol. 2 — LPG (EF 63,100 kgCO2/TJ × NCV 47.3 MJ/kg × density 0.540 kg/L)";
        readonly year: 2006;
        readonly note: "Per LITRE. The form collects cylinders → kg; the cooking processor converts kg→litre via DERIVATION_CONSTANTS.lpgKgPerLitre (0.54). Net ≈ 2.98 kgCO2e/kg, the IPCC per-kg basis. (Old table value 2.98 was mislabelled as petrol.)";
    };
    readonly firewood: {
        readonly value: 1.88;
        readonly unit: "kg";
        readonly scope: "scope1";
        readonly source: "IPCC 2006, Vol. 2 — firewood/biomass full CO2e (CO2 1.747 + CH4@GWP25 + N2O@GWP298, residential)";
        readonly year: 2006;
        readonly note: "Non-renewable assumption for Nepal. CO2-only would be 1.747; full CO2e incl. CH4/N2O = 1.88.";
    };
    readonly charcoal: {
        readonly value: 3.49;
        readonly unit: "kg";
        readonly scope: "scope1";
        readonly source: "IPCC 2006, Vol. 2 — charcoal full CO2e (EF 112,000 kgCO2/TJ × NCV 29.5 MJ/kg = 3.30 CO2 + CH4/N2O)";
        readonly year: 2006;
        readonly note: "Corrected from 6.86 (a coal EF applied by mistake) to 3.49 kgCO2e/kg.";
    };
    readonly commuteWalk: {
        readonly value: 0;
        readonly unit: "passenger-km";
        readonly scope: "scope3";
        readonly source: "Walking / cycling — zero operational emissions";
        readonly year: 2023;
    };
    readonly commuteBicycle: {
        readonly value: 0;
        readonly unit: "passenger-km";
        readonly scope: "scope3";
        readonly source: "Walking / cycling — zero operational emissions";
        readonly year: 2023;
    };
    readonly commuteSchoolBus: {
        readonly value: 0.027;
        readonly unit: "passenger-km";
        readonly scope: "scope3";
        readonly source: "UK DESNZ 2023 (adapted for ~40 occupancy) — school bus (full)";
        readonly year: 2023;
    };
    readonly commutePublicBus: {
        readonly value: 0.089;
        readonly unit: "passenger-km";
        readonly scope: "scope3";
        readonly source: "WRI India GHG Program 2015 (adapted) — public microbus / tempo";
        readonly year: 2015;
    };
    readonly commuteMotorbike: {
        readonly value: 0.113;
        readonly unit: "passenger-km";
        readonly scope: "scope3";
        readonly source: "UK DESNZ 2023 GHG Conversion Factors — motorcycle";
        readonly year: 2023;
        readonly note: "Proxy — no Nepal-specific per-km factor exists. Motorcycles are Nepal’s dominant private vehicle (BUR1 2025).";
    };
    readonly commuteCar: {
        readonly value: 0.171;
        readonly unit: "passenger-km";
        readonly scope: "scope3";
        readonly source: "UK DESNZ 2023 — car / jeep (assumes 1.5 average occupancy)";
        readonly year: 2023;
    };
    readonly paper: {
        readonly value: 1.84;
        readonly unit: "kg";
        readonly scope: "scope3";
        readonly source: "EEA & IPCC paper lifecycle estimates — paper / textbooks";
        readonly year: 2018;
    };
    readonly food: {
        readonly value: 0.9;
        readonly unit: "meal";
        readonly scope: "scope3";
        readonly source: "Poore & Nemecek, Science 2018 (adapted) — dal-bhat (vegetarian), default meal";
        readonly year: 2018;
    };
    readonly foodMixedMeat: {
        readonly value: 1.8;
        readonly unit: "meal";
        readonly scope: "scope3";
        readonly source: "Poore & Nemecek 2018 (adapted) — mixed meal with meat (poultry-dominant)";
        readonly year: 2018;
    };
    readonly foodSnack: {
        readonly value: 0.5;
        readonly unit: "meal";
        readonly scope: "scope3";
        readonly source: "Processed food production literature average — canteen snacks / packaged (low confidence)";
        readonly year: 2018;
        readonly note: "Low confidence — flag in output.";
    };
    readonly waste: {
        readonly value: 0.467;
        readonly unit: "kg";
        readonly scope: "scope3";
        readonly source: "IPCC 2006, Vol. 5, Ch. 3 (Solid Waste Disposal) — municipal landfill";
        readonly year: 2006;
    };
    readonly wasteOpenBurning: {
        readonly value: 0.689;
        readonly unit: "kg";
        readonly scope: "scope3";
        readonly source: "IPCC 2006, Vol. 5, Ch. 5 (Incineration & Open Burning) — priority reduction target";
        readonly year: 2006;
    };
    readonly wasteComposting: {
        readonly value: 0.01;
        readonly unit: "kg";
        readonly scope: "scope3";
        readonly source: "IPCC 2006, Vol. 5 — composting (effectively negligible)";
        readonly year: 2006;
    };
    readonly waterPumped: {
        readonly value: 0.000344;
        readonly unit: "litre";
        readonly scope: "scope3";
        readonly source: "UK Water Industry Research (UKWIR) proxy — pumped municipal supply";
        readonly year: 2020;
        readonly note: "No Nepal-specific water utility energy data exists; minor category.";
    };
    readonly waterGravity: {
        readonly value: 0;
        readonly unit: "litre";
        readonly scope: "scope3";
        readonly source: "Gravity-fed supply — zero pumping emission (common in hill schools)";
        readonly year: 2020;
    };
};
export type EmissionFactorKey = keyof typeof EMISSION_FACTORS;
export declare const GLOBAL_WARMING_POTENTIALS: {
    readonly CO2: 1;
    readonly CH4: 28;
    readonly N2O: 265;
};
export declare const DERIVATION_CONSTANTS: {
    readonly generatorLitresPerKvaHour: 0.25;
    readonly defaultWattsPerRoom: 200;
    readonly paperKgPerReam: 2.5;
    readonly lpgKgPerLitre: 0.54;
    readonly waterLitresPerNpr: 33.3;
    readonly hoursPerYear: 8760;
    readonly schoolDaysPerYear: 200;
    readonly academicWeeksPerYear: 40;
    readonly solarCapacityFactor: 0.2;
    readonly paperKgPerStudentYear: 5;
    readonly wasteKgPerStudentYear: 20;
    readonly foodServingDaysPerYear: 200;
};
export type AreaTypeKey = 'URBAN' | 'PERI_URBAN' | 'RURAL';
export declare const TIER3_DEFAULTS: {
    readonly electricityKwhPerStudentYear: Record<AreaTypeKey, number>;
    readonly generatorLitresPerStudentYear: Record<AreaTypeKey, number>;
    readonly commuteKgPerStudentYear: Record<AreaTypeKey, number>;
    readonly paperKgPerStudentYear: 5;
    readonly wasteKgPerStudentYear: 20;
    readonly mealsPerStudentYear: 0;
};
