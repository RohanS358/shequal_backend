import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RecAudience, Prisma } from '@prisma/client'
import { STUDENT_RECS, STUDENT_ALL_GREEN, SCHOOL_RECS } from './recommendation-content'

@Injectable()
export class RecommendationsService implements OnModuleInit {
  private readonly logger = new Logger(RecommendationsService.name)

  constructor(private readonly prisma: PrismaService) {}

  // Seed the table from the in-code content on first boot (idempotent upsert).
  async onModuleInit() {
    try {
      await this.seed()
    } catch (e) {
      this.logger.warn(`Recommendation seed skipped: ${(e as Error).message}`)
    }
  }

  async seed() {
    // Skip the upsert burst once the table is populated (keeps cold boots quiet
    // and avoids hammering the DB on every restart).
    if ((await this.prisma.recommendation.count()) > 0) return

    const studentRows: Prisma.RecommendationCreateInput[] = [
      ...STUDENT_RECS.map((r) => ({
        audience: RecAudience.STUDENT, ruleKey: r.ruleKey, triggerKey: r.triggerKey,
        triggerValues: r.triggerValues, weight: r.weight, co2SavedKg: r.co2SavedKg,
        icon: r.icon, textEn: r.textEn, textNe: r.textNe,
      })),
      {
        audience: RecAudience.STUDENT, ruleKey: STUDENT_ALL_GREEN.ruleKey, triggerKey: '__all_green__',
        triggerValues: [], weight: 0, co2SavedKg: 0, icon: STUDENT_ALL_GREEN.icon,
        textEn: STUDENT_ALL_GREEN.textEn, textNe: STUDENT_ALL_GREEN.textNe,
      },
    ]
    const schoolRows: Prisma.RecommendationCreateInput[] = SCHOOL_RECS.map((r) => ({
      audience: RecAudience.SCHOOL, ruleKey: r.ruleKey, category: r.category,
      icon: r.icon, titleEn: r.titleEn, titleNe: r.titleNe, textEn: r.textEn, textNe: r.textNe,
      weight: 5, co2SavedKg: 0,
    }))

    for (const data of [...studentRows, ...schoolRows]) {
      await this.prisma.recommendation.upsert({
        where: { ruleKey: data.ruleKey }, update: {}, create: data,
      })
    }
    this.logger.log(`Recommendations seeded (${studentRows.length} student, ${schoolRows.length} school).`)
  }

  // ── STUDENT: match a day's quest answers → tomorrow's action list ──
  async forStudent(answers: Record<string, string> = {}, max = 4) {
    const recs = await this.prisma.recommendation.findMany({
      where: { audience: RecAudience.STUDENT, active: true, triggerKey: { not: '__all_green__' } },
      orderBy: { weight: 'desc' },
    })

    const hits = recs
      .filter((r) => r.triggerKey && r.triggerValues.includes(answers[r.triggerKey]))
      .slice(0, max)
      .map((r) => ({ id: r.ruleKey, icon: r.icon, en: r.textEn, ne: r.textNe, co2Saved: r.co2SavedKg }))

    if (hits.length === 0) {
      const ag = await this.prisma.recommendation.findUnique({ where: { ruleKey: STUDENT_ALL_GREEN.ruleKey } })
      hits.push({
        id: STUDENT_ALL_GREEN.ruleKey, icon: ag?.icon ?? STUDENT_ALL_GREEN.icon,
        en: ag?.textEn ?? STUDENT_ALL_GREEN.textEn, ne: ag?.textNe ?? STUDENT_ALL_GREEN.textNe, co2Saved: 0,
      })
    }

    const potentialCo2Saved = Math.round(hits.reduce((s, r) => s + (r.co2Saved || 0), 0) * 10) / 10
    return { recommendations: hits, potentialCo2Saved }
  }

  // ── SCHOOL: editable content keyed by the engine's ruleKey ──
  // Returns engine recs with icon/title/text replaced by the DB content
  // (computed savings/priority untouched), plus Nepali fields for the UI.
  async applySchoolContent(recs: any[]): Promise<any[]> {
    if (!Array.isArray(recs) || recs.length === 0) return recs
    const rows = await this.prisma.recommendation.findMany({ where: { audience: RecAudience.SCHOOL, active: true } })
    const map = new Map(rows.map((r) => [r.ruleKey, r]))
    return recs.map((rec) => {
      const c = rec?.ruleKey ? map.get(rec.ruleKey) : undefined
      if (!c) return rec
      return { ...rec, icon: c.icon, title: c.titleEn ?? rec.title, text: c.textEn, titleNe: c.titleNe, textNe: c.textNe }
    })
  }

  // ── CRUD (admin editing) ──
  list(audience?: RecAudience) {
    return this.prisma.recommendation.findMany({
      where: audience ? { audience } : undefined,
      orderBy: [{ audience: 'asc' }, { weight: 'desc' }],
    })
  }

  create(data: Prisma.RecommendationCreateInput) {
    return this.prisma.recommendation.create({ data })
  }

  async update(id: string, data: Prisma.RecommendationUpdateInput) {
    const exists = await this.prisma.recommendation.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Recommendation not found')
    return this.prisma.recommendation.update({ where: { id }, data })
  }

  async remove(id: string) {
    const exists = await this.prisma.recommendation.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Recommendation not found')
    await this.prisma.recommendation.delete({ where: { id } })
    return { deleted: true }
  }
}
