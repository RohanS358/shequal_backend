import { CommuteInput, CookingInput, ElectricityInput, FoodInput, GeneratorInput, PaperInput, RefrigerantInput, VehicleInput, WasteInput, WaterInput } from '../engine/types';
export declare class SubmitAuditDto {
    academicYear: number;
    month?: number;
    enrollment?: number;
    areaType?: string;
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
    customFactors?: Record<string, number>;
}
