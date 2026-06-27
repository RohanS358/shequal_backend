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
var RecommendationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const recommendation_content_1 = require("./recommendation-content");
let RecommendationsService = RecommendationsService_1 = class RecommendationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RecommendationsService_1.name);
    }
    async onModuleInit() {
        try {
            await this.seed();
        }
        catch (e) {
            this.logger.warn(`Recommendation seed skipped: ${e.message}`);
        }
    }
    async seed() {
        if ((await this.prisma.recommendation.count()) > 0)
            return;
        const studentRows = [
            ...recommendation_content_1.STUDENT_RECS.map((r) => ({
                audience: client_1.RecAudience.STUDENT, ruleKey: r.ruleKey, triggerKey: r.triggerKey,
                triggerValues: r.triggerValues, weight: r.weight, co2SavedKg: r.co2SavedKg,
                icon: r.icon, textEn: r.textEn, textNe: r.textNe,
            })),
            {
                audience: client_1.RecAudience.STUDENT, ruleKey: recommendation_content_1.STUDENT_ALL_GREEN.ruleKey, triggerKey: '__all_green__',
                triggerValues: [], weight: 0, co2SavedKg: 0, icon: recommendation_content_1.STUDENT_ALL_GREEN.icon,
                textEn: recommendation_content_1.STUDENT_ALL_GREEN.textEn, textNe: recommendation_content_1.STUDENT_ALL_GREEN.textNe,
            },
        ];
        const schoolRows = recommendation_content_1.SCHOOL_RECS.map((r) => ({
            audience: client_1.RecAudience.SCHOOL, ruleKey: r.ruleKey, category: r.category,
            icon: r.icon, titleEn: r.titleEn, titleNe: r.titleNe, textEn: r.textEn, textNe: r.textNe,
            weight: 5, co2SavedKg: 0,
        }));
        for (const data of [...studentRows, ...schoolRows]) {
            await this.prisma.recommendation.upsert({
                where: { ruleKey: data.ruleKey }, update: {}, create: data,
            });
        }
        this.logger.log(`Recommendations seeded (${studentRows.length} student, ${schoolRows.length} school).`);
    }
    async forStudent(answers = {}, max = 4) {
        const recs = await this.prisma.recommendation.findMany({
            where: { audience: client_1.RecAudience.STUDENT, active: true, triggerKey: { not: '__all_green__' } },
            orderBy: { weight: 'desc' },
        });
        const hits = recs
            .filter((r) => r.triggerKey && r.triggerValues.includes(answers[r.triggerKey]))
            .slice(0, max)
            .map((r) => ({ id: r.ruleKey, icon: r.icon, en: r.textEn, ne: r.textNe, co2Saved: r.co2SavedKg }));
        if (hits.length === 0) {
            const ag = await this.prisma.recommendation.findUnique({ where: { ruleKey: recommendation_content_1.STUDENT_ALL_GREEN.ruleKey } });
            hits.push({
                id: recommendation_content_1.STUDENT_ALL_GREEN.ruleKey, icon: ag?.icon ?? recommendation_content_1.STUDENT_ALL_GREEN.icon,
                en: ag?.textEn ?? recommendation_content_1.STUDENT_ALL_GREEN.textEn, ne: ag?.textNe ?? recommendation_content_1.STUDENT_ALL_GREEN.textNe, co2Saved: 0,
            });
        }
        const potentialCo2Saved = Math.round(hits.reduce((s, r) => s + (r.co2Saved || 0), 0) * 10) / 10;
        return { recommendations: hits, potentialCo2Saved };
    }
    async applySchoolContent(recs) {
        if (!Array.isArray(recs) || recs.length === 0)
            return recs;
        const rows = await this.prisma.recommendation.findMany({ where: { audience: client_1.RecAudience.SCHOOL, active: true } });
        const map = new Map(rows.map((r) => [r.ruleKey, r]));
        return recs.map((rec) => {
            const c = rec?.ruleKey ? map.get(rec.ruleKey) : undefined;
            if (!c)
                return rec;
            return { ...rec, icon: c.icon, title: c.titleEn ?? rec.title, text: c.textEn, titleNe: c.titleNe, textNe: c.textNe };
        });
    }
    list(audience) {
        return this.prisma.recommendation.findMany({
            where: audience ? { audience } : undefined,
            orderBy: [{ audience: 'asc' }, { weight: 'desc' }],
        });
    }
    create(data) {
        return this.prisma.recommendation.create({ data });
    }
    async update(id, data) {
        const exists = await this.prisma.recommendation.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Recommendation not found');
        return this.prisma.recommendation.update({ where: { id }, data });
    }
    async remove(id) {
        const exists = await this.prisma.recommendation.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Recommendation not found');
        await this.prisma.recommendation.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = RecommendationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map