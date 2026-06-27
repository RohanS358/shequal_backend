import { Province, AreaType, SchoolType, SchoolContactRole, EnrollmentRange, ElectricityAvailability, InternetConnectivity, PreferredLanguage } from '@prisma/client';
export declare class UpdateSchoolDto {
    name?: string;
    contactName?: string;
    contactRole?: SchoolContactRole;
    contactOther?: string;
    phone?: string;
    province?: Province;
    district?: string;
    areaType?: AreaType;
    schoolType?: SchoolType;
    enrollment?: EnrollmentRange;
    electricity?: ElectricityAvailability;
    connectivity?: InternetConnectivity;
    language?: PreferredLanguage;
}
