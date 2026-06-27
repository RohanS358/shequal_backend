import { CarbonCalculatorService } from './carbon-calculator.service';
import { SubmitAuditDto } from './dto/submit-audit.dto';
export declare class CarbonCalculatorController {
    private readonly service;
    constructor(service: CarbonCalculatorService);
    submit(user: any, dto: SubmitAuditDto): Promise<{
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
    findBySchool(schoolId: string, user: any): Promise<({
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
    })[]>;
    findMine(user: any): Promise<({
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
    })[]>;
    leaderboard(limit?: number): Promise<({
        audit: {
            school: {
                id: string;
                name: string;
                province: import(".prisma/client").$Enums.Province;
                district: string;
            };
            academicYear: number;
        };
    } & {
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
    })[]>;
    findById(id: string, user: any): Promise<{
        school: {
            id: string;
            name: string;
        };
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
    recalculate(id: string): Promise<{
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
