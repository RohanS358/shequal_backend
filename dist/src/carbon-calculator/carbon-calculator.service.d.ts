import { PrismaService } from '../prisma/prisma.service';
import { SubmitAuditDto } from './dto/submit-audit.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { Prisma, UserRole } from '@prisma/client';
export declare class CarbonCalculatorService {
    private readonly prisma;
    private readonly recsService;
    constructor(prisma: PrismaService, recsService: RecommendationsService);
    submitAudit(schoolId: string, submittedById: string, dto: SubmitAuditDto): Promise<{
        result: {
            id: string;
            recommendations: Prisma.JsonValue;
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
            breakdown: Prisma.JsonValue;
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
            inputs: Prisma.JsonValue | null;
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
            recommendations: Prisma.JsonValue;
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
            breakdown: Prisma.JsonValue;
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
            inputs: Prisma.JsonValue | null;
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
    findBySchool(schoolId: string, requestingUser: {
        id: string;
        role: UserRole;
        schoolId?: string;
    }): Promise<({
        result: {
            id: string;
            recommendations: Prisma.JsonValue;
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
            breakdown: Prisma.JsonValue;
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
            inputs: Prisma.JsonValue | null;
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
    findById(id: string, requestingUser: {
        id: string;
        role: UserRole;
        schoolId?: string;
    }): Promise<{
        school: {
            id: string;
            name: string;
        };
        result: {
            id: string;
            recommendations: Prisma.JsonValue;
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
            breakdown: Prisma.JsonValue;
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
            inputs: Prisma.JsonValue | null;
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
    getLeaderboard(limit?: number): Promise<({
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
        recommendations: Prisma.JsonValue;
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
        breakdown: Prisma.JsonValue;
        grade: string | null;
        calculatedAt: Date;
    })[]>;
    private extractCategoryInputs;
    private toResultRow;
}
