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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const XP_PER_LEVEL = 3000;
const levelForXp = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
const stageForLevel = (level) => Math.min(3, Math.floor((level - 1) / 4) + 1);
function localToday() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}
function dayBefore(date) {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() - 1);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreate(userId) {
        const existing = await this.prisma.studentProfile.findUnique({ where: { userId } });
        if (existing)
            return existing;
        return this.prisma.studentProfile.create({ data: { userId } });
    }
    async completeQuest(userId, dto) {
        const profile = await this.getOrCreate(userId);
        const today = dto.date || localToday();
        const xp = profile.xp + dto.gained;
        const level = levelForXp(xp);
        const petStage = stageForLevel(level);
        let streak;
        if (profile.lastQuestDate === today)
            streak = profile.streak || 1;
        else if (profile.lastQuestDate === dayBefore(today))
            streak = profile.streak + 1;
        else
            streak = 1;
        const updated = await this.prisma.studentProfile.update({
            where: { userId },
            data: {
                xp,
                level,
                petStage,
                petHappiness: Math.min(100, profile.petHappiness + Math.floor(dto.gained / 8)),
                streak,
                lastQuestDate: today,
                totalCo2Saved: profile.totalCo2Saved + (dto.co2Saved ?? 0),
            },
        });
        return {
            ...updated,
            leveledUp: level > profile.level,
            evolved: petStage > profile.petStage,
        };
    }
    async completeLesson(userId) {
        await this.getOrCreate(userId);
        return this.prisma.studentProfile.update({
            where: { userId },
            data: { lessonsCompleted: { increment: 1 } },
        });
    }
    async awardXp(userId, amount, extra = {}) {
        const profile = await this.getOrCreate(userId);
        const xp = profile.xp + Math.max(0, amount);
        const level = levelForXp(xp);
        const petStage = stageForLevel(level);
        const updated = await this.prisma.studentProfile.update({
            where: { userId },
            data: {
                xp, level, petStage,
                petHappiness: Math.min(100, profile.petHappiness + 2),
                ...(extra.lessons ? { lessonsCompleted: { increment: extra.lessons } } : {}),
            },
        });
        return { ...updated, leveledUp: level > profile.level, evolved: petStage > profile.petStage };
    }
    async updateProfile(userId, dto) {
        await this.getOrCreate(userId);
        return this.prisma.studentProfile.update({ where: { userId }, data: dto });
    }
    async leaderboard(schoolId, limit = 20) {
        const rows = await this.prisma.studentProfile.findMany({
            where: schoolId ? { user: { schoolId } } : undefined,
            orderBy: { xp: 'desc' },
            take: limit,
            select: {
                xp: true, level: true, streak: true, petStage: true,
                user: { select: { id: true, name: true, school: { select: { name: true } } } },
            },
        });
        return rows.map((r, i) => ({
            rank: i + 1,
            userId: r.user.id,
            name: r.user.name,
            school: r.user.school?.name ?? null,
            xp: r.xp,
            level: r.level,
            streak: r.streak,
            petStage: r.petStage,
        }));
    }
    async classStandings(userId) {
        await this.getOrCreate(userId);
        const me = await this.prisma.user.findUnique({
            where: { id: userId }, select: { schoolId: true, className: true },
        });
        if (!me?.schoolId || !me?.className) {
            return { className: me?.className ?? null, ranking: [], isHero: false };
        }
        const profiles = await this.prisma.studentProfile.findMany({
            where: { user: { schoolId: me.schoolId, className: me.className, role: 'STUDENT' } },
            orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }],
            include: { user: { select: { id: true, name: true, rollNo: true } } },
        });
        const ranking = profiles.map((p, i) => ({
            rank: i + 1, studentId: p.userId, name: p.user.name, rollNo: p.user.rollNo,
            xp: p.xp, level: p.level, petStage: p.petStage, streak: p.streak,
            isMe: p.userId === userId,
        }));
        return { className: me.className, ranking, isHero: ranking.find((r) => r.isMe)?.rank === 1 };
    }
    async schoolStandings(userId, limit = 100) {
        await this.getOrCreate(userId);
        const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true } });
        if (!me?.schoolId)
            return { ranking: [] };
        const profiles = await this.prisma.studentProfile.findMany({
            where: { user: { schoolId: me.schoolId, role: 'STUDENT' } },
            orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }],
            take: limit,
            include: { user: { select: { id: true, name: true, className: true, rollNo: true } } },
        });
        const ranking = profiles.map((p, i) => ({
            rank: i + 1, studentId: p.userId, name: p.user.name, className: p.user.className, rollNo: p.user.rollNo,
            xp: p.xp, level: p.level, petStage: p.petStage, streak: p.streak,
            isMe: p.userId === userId,
        }));
        return { ranking };
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
//# sourceMappingURL=students.service.js.map