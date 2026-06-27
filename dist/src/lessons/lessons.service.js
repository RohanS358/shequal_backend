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
var LessonsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const students_service_1 = require("../students/students.service");
const lesson_content_1 = require("./lesson-content");
let LessonsService = LessonsService_1 = class LessonsService {
    constructor(prisma, students) {
        this.prisma = prisma;
        this.students = students;
        this.logger = new common_1.Logger(LessonsService_1.name);
    }
    async onModuleInit() {
        try {
            await this.seedIfEmpty();
        }
        catch (e) {
            this.logger.warn(`Lesson seed skipped: ${e.message}`);
        }
    }
    async seedIfEmpty() {
        const count = await this.prisma.lesson.count();
        if (count > 0)
            return;
        for (const l of lesson_content_1.LESSONS) {
            await this.prisma.lesson.create({
                data: {
                    order: l.order, slug: l.slug, icon: l.icon, color: l.color, category: l.category,
                    titleEn: l.titleEn, titleNe: l.titleNe, descEn: l.descEn, descNe: l.descNe,
                    xpReward: l.xpReward, questions: l.questions,
                },
            });
        }
        this.logger.log(`Seeded ${lesson_content_1.LESSONS.length} lessons.`);
    }
    async listForUser(userId) {
        await this.seedIfEmpty();
        const [lessons, progress] = await Promise.all([
            this.prisma.lesson.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
            this.prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true } }),
        ]);
        const done = new Set(progress.map((p) => p.lessonId));
        return lessons.map((l, i) => {
            const completed = done.has(l.id);
            const prevCompleted = i === 0 || done.has(lessons[i - 1].id);
            return { ...l, completed, locked: !completed && !prevCompleted };
        });
    }
    async complete(userId, lessonId) {
        const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson)
            throw new common_1.NotFoundException('Lesson not found');
        const existing = await this.prisma.lessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
        });
        if (existing) {
            const profile = await this.students.getOrCreate(userId);
            return { lessonId, alreadyDone: true, xpReward: 0, profile };
        }
        await this.prisma.lessonProgress.create({ data: { userId, lessonId } });
        const profile = await this.students.awardXp(userId, lesson.xpReward, { lessons: 1 });
        return { lessonId, alreadyDone: false, xpReward: lesson.xpReward, profile };
    }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = LessonsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        students_service_1.StudentsService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map