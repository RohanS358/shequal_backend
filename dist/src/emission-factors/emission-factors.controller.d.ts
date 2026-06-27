import { EmissionFactorsService } from './emission-factors.service';
interface UploadedCsv {
    buffer: Buffer;
    originalname?: string;
}
export declare class EmissionFactorsController {
    private readonly factors;
    constructor(factors: EmissionFactorsService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        updatedAt: Date;
        source: string;
        value: number;
        key: string;
        scope: string;
        unit: string;
        year: number;
        note: string | null;
    }[]>;
    upload(file: UploadedCsv): Promise<{
        updated: number;
        keys: string[];
        appliedToEngine: number;
        note: string;
    }>;
    update(key: string, body: {
        value: number;
        unit?: string;
        scope?: string;
        source?: string;
        year?: number;
        note?: string;
    }): Promise<{
        updatedAt: Date;
        source: string;
        value: number;
        key: string;
        scope: string;
        unit: string;
        year: number;
        note: string | null;
    }>;
}
export {};
