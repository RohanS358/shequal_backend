import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SubmitAuditDto } from './dto/submit-audit.dto'
import { runCalculation } from './engine/calculation-engine'
import { CATEGORY_PROCESSORS } from './engine/category-processors'
import { AuditContext, CategoryInputs, CategoryResolution } from './engine/types'
import { EMISSION_FACTORS, AreaTypeKey } from './config/emission-factors.config'
import { RecommendationsService } from '../recommendations/recommendations.service'
import { ActivityCategory, EnrollmentRange, Prisma, UserRole } from '@prisma/client'

// Reverse lookup: ActivityCategory enum → CategoryInputs key.
const CATEGORY_TO_KEY = new Map(
  Object.entries(CATEGORY_PROCESSORS).map(([key, p]) => [p.category, key]),
)

// Categories the installed Prisma Client / DB actually knows about. A resolved
// line for a category that isn't in the generated enum (e.g. WATER before its
// migration + `prisma generate` have been run) is kept in the result totals &
// breakdown but skipped for the enum-constrained activity_data table, so a
// submission never 500s on a not-yet-migrated category.
const VALID_ACTIVITY_CATEGORIES = new Set<string>(Object.values(ActivityCategory))

function persistableActivities(
  resolutions: CategoryResolution[],
  auditId: string,
): Prisma.ActivityDataCreateManyInput[] {
  const skipped: string[] = []
  const rows = resolutions
    .filter((r) => {
      const ok = VALID_ACTIVITY_CATEGORIES.has(r.category)
      if (!ok) skipped.push(r.category)
      return ok
    })
    .map((r) => ({
      auditId,
      category: r.category,
      scope: r.scope,
      tier: r.tier,
      activityValue: r.activityValue,
      unit: r.unit,
      emissions: r.emissions,
      inputs: (r.inputs ?? {}) as Prisma.InputJsonValue,
      note: r.note,
    }))
  if (skipped.length) {
    new Logger('CarbonCalculatorService').warn(
      `Skipped activity_data rows for un-migrated categories: ${skipped.join(', ')}. ` +
        `They still count in totals/breakdown. Run prisma migrate deploy + prisma generate to persist them.`,
    )
  }
  return rows
}

// Midpoint fallback when an exact enrollment count isn't provided.
const ENROLLMENT_MIDPOINT: Record<EnrollmentRange, number> = {
  UNDER_100: 50,
  RANGE_100_500: 300,
  RANGE_500_1000: 750,
  OVER_1000: 1500,
}

const CATEGORY_KEYS: (keyof CategoryInputs)[] = [
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
]

@Injectable()
export class CarbonCalculatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recsService: RecommendationsService,
  ) {}

  // ---------------------------------------------------------------
  // SUBMIT AUDIT — upsert header, (re)build activity rows, calculate.
  // ---------------------------------------------------------------
  async submitAudit(schoolId: string, submittedById: string, dto: SubmitAuditDto) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) throw new NotFoundException('School not found')

    const resolvedMonth = dto.month ?? 0
    const enrollment =
      dto.enrollment && dto.enrollment > 0
        ? dto.enrollment
        : ENROLLMENT_MIDPOINT[school.enrollment]

    const areaType = (dto.areaType || school.areaType) as AreaTypeKey
    const ctx: AuditContext = { enrollment, areaType }

    const inputs = this.extractCategoryInputs(dto)

    // Apply per-submission custom factor overrides, then restore immediately after
    // the synchronous calculation so concurrent requests never see them.
    const savedFactors: Record<string, number> = {}
    if (dto.customFactors && Object.keys(dto.customFactors).length > 0) {
      const F = EMISSION_FACTORS as unknown as Record<string, { value: number }>
      for (const [key, value] of Object.entries(dto.customFactors)) {
        if (F[key] !== undefined && typeof value === 'number' && isFinite(value)) {
          savedFactors[key] = F[key].value
          F[key].value = value
        }
      }
    }

    const calc = runCalculation(inputs, ctx)

    // Restore before any await so no other request sees this submission's overrides.
    if (Object.keys(savedFactors).length > 0) {
      const F = EMISSION_FACTORS as unknown as Record<string, { value: number }>
      for (const [key, value] of Object.entries(savedFactors)) F[key].value = value
    }

    calc.recommendations = await this.recsService.applySchoolContent(calc.recommendations)

    // Persist atomically: header → activities → result.
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
      })

      // Activity data is rebuilt fresh for this submission.
      await tx.activityData.deleteMany({ where: { auditId: header.id } })
      await tx.activityData.createMany({
        data: persistableActivities(calc.resolutions, header.id),
      })

      await tx.carbonResult.upsert({
        where: { auditId: header.id },
        update: this.toResultRow(calc),
        create: { auditId: header.id, ...this.toResultRow(calc) },
      })

      return header
    })

    return this.prisma.carbonAudit.findUnique({
      where: { id: audit.id },
      include: { result: true, activities: true },
    })
  }

  // ---------------------------------------------------------------
  // RECALCULATE — re-run the engine from stored activity inputs.
  // Use after updating emission factors in the config file.
  // ---------------------------------------------------------------
  async recalculate(id: string) {
    const audit = await this.prisma.carbonAudit.findUnique({
      where: { id },
      include: { activities: true, school: true },
    })
    if (!audit) throw new NotFoundException('Audit not found')

    // Rebuild the per-category inputs map from stored activity rows.
    const inputs: CategoryInputs = {}
    for (const a of audit.activities) {
      const key = CATEGORY_TO_KEY.get(a.category)
      if (key) (inputs as Record<string, unknown>)[key] = a.inputs ?? {}
    }

    const ctx: AuditContext = {
      enrollment:
        audit.enrollment > 0
          ? audit.enrollment
          : ENROLLMENT_MIDPOINT[audit.school.enrollment],
      areaType: audit.school.areaType as AreaTypeKey,
    }

    const calc = runCalculation(inputs, ctx)
    calc.recommendations = await this.recsService.applySchoolContent(calc.recommendations)

    await this.prisma.$transaction(async (tx) => {
      await tx.activityData.deleteMany({ where: { auditId: id } })
      await tx.activityData.createMany({
        data: persistableActivities(calc.resolutions, id),
      })
      await tx.carbonResult.upsert({
        where: { auditId: id },
        update: this.toResultRow(calc),
        create: { auditId: id, ...this.toResultRow(calc) },
      })
    })

    return this.prisma.carbonAudit.findUnique({
      where: { id },
      include: { result: true, activities: true },
    })
  }

  // ---------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------
  async findBySchool(
    schoolId: string,
    requestingUser: { id: string; role: UserRole; schoolId?: string },
  ) {
    const isSuperAdmin = requestingUser.role === UserRole.SUPER_ADMIN
    const isOwnSchool = requestingUser.schoolId === schoolId
    if (!isSuperAdmin && !isOwnSchool) {
      throw new ForbiddenException('You can only view your own school audits')
    }
    // Most-recently-submitted first, so the dashboard always reflects the
    // latest submission (not just the highest academic year).
    return this.prisma.carbonAudit.findMany({
      where: { schoolId },
      orderBy: [{ updatedAt: 'desc' }, { academicYear: 'desc' }, { month: 'desc' }],
      include: { result: true, activities: true },
    })
  }

  async findById(
    id: string,
    requestingUser: { id: string; role: UserRole; schoolId?: string },
  ) {
    const audit = await this.prisma.carbonAudit.findUnique({
      where: { id },
      include: {
        result: true,
        activities: true,
        school: { select: { id: true, name: true } },
      },
    })
    if (!audit) throw new NotFoundException('Audit not found')

    const isSuperAdmin = requestingUser.role === UserRole.SUPER_ADMIN
    const isOwnSchool = requestingUser.schoolId === audit.schoolId
    if (!isSuperAdmin && !isOwnSchool) throw new ForbiddenException('Access denied')

    return audit
  }

  // ---------------------------------------------------------------
  // LEADERBOARD — lowest emissions per student.
  // Same-period comparison left to the caller via the query filter.
  // ---------------------------------------------------------------
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
    })
  }

  // ---------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------
  private extractCategoryInputs(dto: SubmitAuditDto): CategoryInputs {
    const inputs: CategoryInputs = {}
    for (const key of CATEGORY_KEYS) {
      const value = (dto as unknown as Record<string, unknown>)[key]
      if (value !== undefined && value !== null) {
        ;(inputs as Record<string, unknown>)[key] = value
      }
    }
    return inputs
  }

  private toResultRow(calc: ReturnType<typeof runCalculation>) {
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
      breakdown: calc.breakdown as Prisma.InputJsonValue,
      recommendations: calc.recommendations as Prisma.InputJsonValue,
    }
  }
}
