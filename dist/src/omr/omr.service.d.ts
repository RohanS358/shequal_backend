import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface UploadedImage {
    buffer: Buffer;
    originalname?: string;
    mimetype?: string;
}
export type SheetType = 'school' | 'student';
export declare class OmrService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private paths;
    private mappings;
    constructor(config: ConfigService);
    onModuleInit(): void;
    scan(image: UploadedImage, sheet?: SheetType): Promise<{
        sheet: SheetType;
        submit: boolean;
        answers: {
            key: string;
            question: string;
            answer: string | null;
        }[];
        audit: Record<string, unknown>;
    }>;
    private runRegister;
    private runChecker;
    private readResults;
    private decode;
    private pickExt;
    private parseCsvLine;
    private resolvePaths;
}
