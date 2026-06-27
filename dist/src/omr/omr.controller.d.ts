import { OmrService, UploadedImage, SheetType } from './omr.service';
import { CarbonCalculatorService } from '../carbon-calculator/carbon-calculator.service';
export declare class OmrController {
    private readonly omr;
    private readonly carbon;
    constructor(omr: OmrService, carbon: CarbonCalculatorService);
    scan(file: UploadedImage, sheet?: string): Promise<{
        sheet: SheetType;
        submit: boolean;
        answers: {
            key: string;
            question: string;
            answer: string | null;
        }[];
        audit: Record<string, unknown>;
    }>;
    scanAndSubmit(file: UploadedImage, academicYear: string, month: string, sheet: string, user: {
        id: string;
        schoolId: string;
    }): Promise<{
        result: {
            id: string;
            recommendations: import("@prisma/client/runtime/library").JsonValue;
            auditId: string;
            scope1Emissions: number;
            scope2Emissions: number;
            scope3Emissions: number;
            totalEmissions: number;
            emissionsPerStudent: number | null;
            tier1Pct: number;
            tier2Pct: number;
            tier3Pct: number;
            confidenceScore: number;
            partiallyDefault: boolean;
            breakdown: import("@prisma/client/runtime/library").JsonValue;
            grade: string | null;
            calculatedAt: Date;
        };
        activities: {
            id: string;
            createdAt: Date;
            scope: import(".prisma/client").$Enums.EmissionScope;
            category: import(".prisma/client").$Enums.ActivityCategory;
            unit: string;
            note: string | null;
            emissions: number;
            activityValue: number;
            tier: import(".prisma/client").$Enums.DataTier;
            auditId: string;
            inputs: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        enrollment: number;
        status: import(".prisma/client").$Enums.AuditStatus;
        academicYear: number;
        month: number;
        submittedById: string | null;
    }>;
}
