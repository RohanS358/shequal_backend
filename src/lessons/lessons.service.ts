import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { StudentsService } from '../students/students.service'
import { LESSONS } from './lesson-content'
import { Prisma } from '@prisma/client'

@Injectable()
export class LessonsService implements OnModuleInit {
  private readonly logger = new Logger(LessonsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly students: StudentsService,
  ) {}

  async onModuleInit() {
    try { await this.seedIfEmpty() } catch (e) {
      this.logger.warn(`Lesson seed skipped: ${(e as Error).message}`)
    }
  }

  async seedIfEmpty() {
    const count = await this.prisma.lesson.count()
    if (count > 0) return
    for (const l of LESSONS) {
      await this.prisma.lesson.create({
        data: {
          order: l.order, slug: l.slug, icon: l.icon, color: l.color, category: l.category,
          titleEn: l.titleEn, titleNe: l.titleNe, descEn: l.descEn, descNe: l.descNe,
          xpReward: l.xpReward, questions: l.questions as unknown as Prisma.InputJsonValue,
        },
      })
    }
    this.logger.log(`Seeded ${LESSONS.length} lessons.`)
  }

  // The roadmap: every active lesson + this student's completion & lock state.
  // A lesson unlocks once the previous one is complete (Duolingo-style path).
  async listForUser(userId: string) {
    await this.seedIfEmpty()
    const [lessons, progress] = await Promise.all([
      this.prisma.lesson.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
      this.prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true } }),
    ])
    const done = new Set(progress.map((p) => p.lessonId))
    return lessons.map((l, i) => {
      const completed = done.has(l.id)
      const prevCompleted = i === 0 || done.has(lessons[i - 1].id)
      return { ...l, completed, locked: !completed && !prevCompleted }
    })
  }

  // Mark a lesson complete (idempotent): award XP + bump the lessons counter once.
  async complete(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson) throw new NotFoundException('Lesson not found')

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })
    if (existing) {
      const profile = await this.students.getOrCreate(userId)
      return { lessonId, alreadyDone: true, xpReward: 0, profile }
    }

    await this.prisma.lessonProgress.create({ data: { userId, lessonId } })
    const profile = await this.students.awardXp(userId, lesson.xpReward, { lessons: 1 })
    return { lessonId, alreadyDone: false, xpReward: lesson.xpReward, profile }
  }
}
