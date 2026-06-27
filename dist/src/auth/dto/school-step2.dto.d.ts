import { Province, AreaType, SchoolType } from '@prisma/client';
export declare class SchoolStep2Dto {
    province: Province;
    district: string;
    areaType: AreaType;
    schoolType: SchoolType;
}
