import { SchoolContactRole } from '@prisma/client';
export declare class SchoolStep1Dto {
    schoolName: string;
    contactName: string;
    contactRole: SchoolContactRole;
    contactOther?: string;
    email: string;
    phone?: string;
    password: string;
}
