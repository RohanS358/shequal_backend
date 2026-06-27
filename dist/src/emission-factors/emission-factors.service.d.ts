import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class EmissionFactorsService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    seedIfEmpty(): Promise<void>;
    applyOverrides(): Promise<number>;
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
    upsertOne(key: string, data: Partial<{
        value: number;
        unit: string;
        scope: string;
        source: string;
        year: number;
        note: string;
    }>): Promise<{
        updatedAt: Date;
        source: string;
        value: number;
        key: string;
        scope: string;
        unit: string;
        year: number;
        note: string | null;
    }>;
    upsertFromCsv(buffer?: Buffer): Promise<{
        updated: number;
        keys: string[];
        appliedToEngine: number;
        note: string;
    }>;
}
