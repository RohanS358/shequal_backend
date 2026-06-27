"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarbonCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const calculation_engine_1 = require("./engine/calculation-engine");
const category_processors_1 = require("./engine/category-processors");
const emission_factors_config_1 = require("./config/emission-factors.config");
const recommendations_service_1 = require("../recommendations/recommendations.service");
const client_1 = require("@prisma/client");
const CATEGORY_TO_KEY = new Map(Object.entries(category_processors_1.CATEGORY_PROCESSORS).map(([key, p]) => [p.category, key]));
const VALID_ACTIVITY_CATEGORIES = new Set(Object.values(client_1.ActivityCategory));
function persistableActivities(resolutions, auditId) {
    const skipped = [];
    const rows = resolutions
        .filter((r) => {
        const ok = VALID_ACTIVITY_CATEGORIES.has(r.category);
        if (!ok)
            skipped.push(r.category);
        return ok;
    })
        .map((r) => ({
        auditId,
        category: r.category,
        scope: r.scope,
        tier: r.tier,
        activityValue: r.activityValue,
        unit: r.unit,
        emissions: r.emissions,
        inputs: (r.inputs ?? {}),
        note: r.note,
    }));
    if (skipped.length) {
        new common_1.Logger('CarbonCalculatorService').warn(`Skipped activity_data rows for un-migrated categories: ${skipped.join(', ')}. ` +
            `They still count in totals/breakdown. Run prisma migrate deploy + prisma generate to persist them.`);
    }
    return rows;
}
const ENROLLMENT_MIDPOINT = {
    UNDER_100: 50,
    RANGE_100_500: 300,
    RANGE_500_1000: 750,
    OVER_1000: 1500,
};
const CATEGORY_KEYS = [
    'electricity',
    'generator',
    'vehicle',
    'cooking',
    'refrigerant',
    'commute',
    'paper',
    'food',
    'waste',
    'water',
];
let CarbonCalculatorService = class CarbonCalculatorService {
    constructor(prisma, recsService) {
        this.prisma = prisma;
        this.recsService = recsService;
    }
    async submitAudit(schoolId, submittedById, dto) {
        const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        const resolvedMonth = dto.month ?? 0;
        const enrollment = dto.enrollment && dto.enrollment > 0
            ? dto.enrollment
            : ENROLLMENT_MIDPOINT[school.enrollment];
        const areaType = (dto.areaType || school.areaType);
        const ctx = { enrollment, areaType };
        const inputs = this.extractCategoryInputs(dto);
        const savedFactors = {};
        if (dto.customFactors && Object.keys(dto.customFactors).length > 0) {
            const F = emission_factors_config_1.EMISSION_FACTORS;
            for (const [key, value] of Object.entries(dto.customFactors)) {
                if (F[key] !== undefined && typeof value === 'number' && isFinite(value)) {
                    savedFactors[key] = F[key].value;
                    F[key].value = value;
                }
            }
        }
        const calc = (0, calculation_engine_1.runCalculation)(inputs, ctx);
        if (Object.keys(savedFactors).length > 0) {
            const F = emission_factors_config_1.EMISSION_FACTORS;
            for (const [key, value] of Object.entries(savedFactors))
                F[key].value = value;
        }
        calc.recommendations = await this.recsService.applySchoolContent(calc.recommendations);
        const audit = await this.prisma.$transaction(async (tx) => {
            const header = await tx.carbonAudit.upsert({
                where: {
                    schoolId_academicYear_month: {
                        schoolId,
                        academicYear: dto.academicYear,
                        month: resolvedMonth,
                    },
                },
                update: { enrollment, submittedById, status: 'CALCULATED' },
                create: {
                    schoolId,
                    academicYear: dto.academicYear,
                    month: resolvedMonth,
                    enrollment,
                    submittedById,
                    status: 'CALCULATED',
                },
            });
            await tx.activityData.deleteMany({ where: { auditId: header.id } });
            await tx.activityData.createMany({
                data: persistableActivities(calc.resolutions, header.id),
            });
            await tx.carbonResult.upsert({
                where: { auditId: header.id },
                update: this.toResultRow(calc),
                create: { auditId: header.id, ...this.toResultRow(calc) },
            });
            return header;
        });
        return this.prisma.carbonAudit.findUnique({
            where: { id: audit.id },
            include: { result: true, activities: true },
        });
    }
    async recalculate(id) {
        const audit = await this.prisma.carbonAudit.findUnique({
            where: { id },
            include: { activities: true, school: true },
        });
        if (!audit)
            throw new common_1.NotFoundException('Audit not found');
        const inputs = {};
        for (const a of audit.activities) {
            const key = CATEGORY_TO_KEY.get(a.category);
            if (key)
                inputs[key] = a.inputs ?? {};
        }
        const ctx = {
            enrollment: audit.enrollment > 0
                ? audit.enrollment
                : ENROLLMENT_MIDPOINT[audit.school.enrollment],
            areaType: audit.school.areaType,
        };
        const calc = (0, calculation_engine_1.runCalculation)(inputs, ctx);
        calc.recommendations = await this.recsService.applySchoolContent(calc.recommendations);
        await this.prisma.$transaction(async (tx) => {
            await tx.activityData.deleteMany({ where: { auditId: id } });
            await tx.activityData.createMany({
                data: persistableActivities(calc.resolutions, id),
            });
            await tx.carbonResult.upsert({
                where: { auditId: id },
                update: this.toResultRow(calc),
                create: { auditId: id, ...this.toResultRow(calc) },
            });
        });
        return this.prisma.carbonAudit.findUnique({
            where: { id },
            include: { result: true, activities: true },
        });
    }
    async findBySchool(schoolId, requestingUser) {
        const isSuperAdmin = requestingUser.role === client_1.UserRole.SUPER_ADMIN;
        const isOwnSchool = requestingUser.schoolId === schoolId;
        if (!isSuperAdmin && !isOwnSchool) {
            throw new common_1.ForbiddenException('You can only view your own school audits');
        }
        return this.prisma.carbonAudit.findMany({
            where: { schoolId },
            orderBy: [{ updatedAt: 'desc' }, { academicYear: 'desc' }, { month: 'desc' }],
            include: { result: true, activities: true },
        });
    }
    async findById(id, requestingUser) {
        const audit = await this.prisma.carbonAudit.findUnique({
            where: { id },
            include: {
                result: true,
                activities: true,
                school: { select: { id: true, name: true } },
            },
        });
        if (!audit)
            throw new common_1.NotFoundException('Audit not found');
        const isSuperAdmin = requestingUser.role === client_1.UserRole.SUPER_ADMIN;
        const isOwnSchool = requestingUser.schoolId === audit.schoolId;
        if (!isSuperAdmin && !isOwnSchool)
            throw new common_1.ForbiddenException('Access denied');
        return audit;
    }
    async getLeaderboard(limit = 10) {
        return this.prisma.carbonResult.findMany({
            where: { emissionsPerStudent: { not: null } },
            orderBy: { emissionsPerStudent: 'asc' },
            take: limit,
            include: {
                audit: {
                    select: {
                        academicYear: true,
                        school: {
                            select: { id: true, name: true, province: true, district: true },
                        },
                    },
                },
            },
        });
    }
    extractCategoryInputs(dto) {
        const inputs = {};
        for (const key of CATEGORY_KEYS) {
            const value = dto[key];
            if (value !== undefined && value !== null) {
                ;
                inputs[key] = value;
            }
        }
        return inputs;
    }
    toResultRow(calc) {
        return {
            scope1Emissions: calc.scope1Emissions,
            scope2Emissions: calc.scope2Emissions,
            scope3Emissions: calc.scope3Emissions,
            totalEmissions: calc.totalEmissions,
            emissionsPerStudent: calc.emissionsPerStudent,
            tier1Pct: calc.tier1Pct,
            tier2Pct: calc.tier2Pct,
            tier3Pct: calc.tier3Pct,
            confidenceScore: calc.confidenceScore,
            partiallyDefault: calc.partiallyDefault,
            grade: calc.grade,
            breakdown: calc.breakdown,
            recommendations: calc.recommendations,
        };
    }
};
exports.CarbonCalculatorService = CarbonCalculatorService;
exports.CarbonCalculatorService = CarbonCalculatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        recommendations_service_1.RecommendationsService])
], CarbonCalculatorService);
//# sourceMappingURL=carbon-calculator.service.js.map