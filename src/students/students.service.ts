import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { QuestCompleteDto, UpdateProfileDto } from './dto/quest-complete.dto'

// XP/level/stage rules — kept in sync with the frontend progressStore so the
// optimistic client update and the authoritative server value always agree.
const XP_PER_LEVEL = 3000
const levelForXp = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1
const stageForLevel = (level: number) => Math.min(3, Math.floor((level - 1) / 4) + 1)

function localToday(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Day before a 'YYYY-MM-DD' string (used for streak continuity).
function dayBefore(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  // The pet record, created at ZERO the first time a student asks for it.
  async getOrCreate(userId: string) {
    const existing = await this.prisma.studentProfile.findUnique({ where: { userId } })
    if (existing) return existing
    return this.prisma.studentProfile.create({ data: { userId } })
  }

  // Bank a finished daily quest: add XP, grow the pet, advance the streak.
  async completeQuest(userId: string, dto: QuestCompleteDto) {
    const profile = await this.getOrCreate(userId)
    const today = dto.date || localToday()

    const xp = profile.xp + dto.gained
    const level = levelForXp(xp)
    const petStage = stageForLevel(level)

    // Streak: +1 if yesterday was completed, unchanged if already done today,
    // otherwise it restarts at 1.
    let streak: number
    if (profile.lastQuestDate === today) streak = profile.streak || 1
    else if (profile.lastQuestDate === dayBefore(today)) streak = profile.streak + 1
    else streak = 1

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
    })

    return {
      ...updated,
      leveledUp: level > profile.level,
      evolved: petStage > profile.petStage,
    }
  }

  async completeLesson(userId: string) {
    await this.getOrCreate(userId)
    return this.prisma.studentProfile.update({
      where: { userId },
      data: { lessonsCompleted: { increment: 1 } },
    })
  }

  // Award XP from any source (e.g. a finished lesson), growing the pet. Pass
  // extra.lessons to also bump the lessons-completed counter in the same write.
  async awardXp(userId: string, amount: number, extra: { lessons?: number } = {}) {
    const profile = await this.getOrCreate(userId)
    const xp = profile.xp + Math.max(0, amount)
    const level = levelForXp(xp)
    const petStage = stageForLevel(level)
    const updated = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        xp, level, petStage,
        petHappiness: Math.min(100, profile.petHappiness + 2),
        ...(extra.lessons ? { lessonsCompleted: { increment: extra.lessons } } : {}),
      },
    })
    return { ...updated, leveledUp: level > profile.level, evolved: petStage > profile.petStage }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.getOrCreate(userId)
    return this.prisma.studentProfile.update({ where: { userId }, data: dto })
  }

  // Top students by XP (== carbon-leader score). Scoped to a school when given.
  async leaderboard(schoolId?: string, limit = 20) {
    const rows = await this.prisma.studentProfile.findMany({
      where: schoolId ? { user: { schoolId } } : undefined,
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        xp: true, level: true, streak: true, petStage: true,
        user: { select: { id: true, name: true, school: { select: { name: true } } } },
      },
    })
    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user.id,
      name: r.user.name,
      school: r.user.school?.name ?? null,
      xp: r.xp,
      level: r.level,
      streak: r.streak,
      petStage: r.petStage,
    }))
  }

  // ── CLASS standings: my classmates ranked by pet experience (xp) ──
  // Higher xp = greener daily habits = higher rank. Rank 1 = class Carbon Hero.
  async classStandings(userId: string) {
    await this.getOrCreate(userId)
    const me = await this.prisma.user.findUnique({
      where: { id: userId }, select: { schoolId: true, className: true },
    })
    if (!me?.schoolId || !me?.className) {
      return { className: me?.className ?? null, ranking: [], isHero: false }
    }
    const profiles = await this.prisma.studentProfile.findMany({
      where: { user: { schoolId: me.schoolId, className: me.className, role: 'STUDENT' } },
      orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }],
      include: { user: { select: { id: true, name: true, rollNo: true } } },
    })
    const ranking = profiles.map((p, i) => ({
      rank: i + 1, studentId: p.userId, name: p.user.name, rollNo: p.user.rollNo,
      xp: p.xp, level: p.level, petStage: p.petStage, streak: p.streak,
      isMe: p.userId === userId,
    }))
    return { className: me.className, ranking, isHero: ranking.find((r) => r.isMe)?.rank === 1 }
  }

  // ── SCHOOL standings: everyone in my school ranked by pet experience (xp) ──
  // Rank 1 = the school's Super Carbon Hero.
  async schoolStandings(userId: string, limit = 100) {
    await this.getOrCreate(userId)
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true } })
    if (!me?.schoolId) return { ranking: [] }
    const profiles = await this.prisma.studentProfile.findMany({
      where: { user: { schoolId: me.schoolId, role: 'STUDENT' } },
      orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      include: { user: { select: { id: true, name: true, className: true, rollNo: true } } },
    })
    const ranking = profiles.map((p, i) => ({
      rank: i + 1, studentId: p.userId, name: p.user.name, className: p.user.className, rollNo: p.user.rollNo,
      xp: p.xp, level: p.level, petStage: p.petStage, streak: p.streak,
      isMe: p.userId === userId,
    }))
    return { ranking }
  }
}
