import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EMISSION_FACTORS } from '../carbon-calculator/config/emission-factors.config'

type MutableFactors = Record<string, { value: number; unit: string; scope: string; source: string; year: number; note?: string }>

// Minimal, dependency-free CSV parser (handles quoted fields with commas).
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false }
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

@Injectable()
export class EmissionFactorsService implements OnModuleInit {
  private readonly logger = new Logger(EmissionFactorsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedIfEmpty()
      await this.applyOverrides()
    } catch (e) {
      this.logger.warn(`Emission-factor init skipped: ${(e as Error).message}`)
    }
  }

  // Seed DB from the hardcoded config the first time.
  async seedIfEmpty() {
    const count = await this.prisma.emissionFactor.count()
    if (count > 0) return
    const entries = Object.entries(EMISSION_FACTORS as unknown as MutableFactors)
    for (const [key, f] of entries) {
      await this.prisma.emissionFactor.create({
        data: { key, value: f.value, unit: f.unit, scope: f.scope, source: f.source, year: f.year, note: f.note ?? null },
      })
    }
    this.logger.log(`Seeded ${entries.length} emission factors.`)
  }

  // Push DB values onto the in-memory config object the engine reads from, so
  // the calculator uses DB/CSV-customised factors with no engine change.
  async applyOverrides() {
    const rows = await this.prisma.emissionFactor.findMany()
    const F = EMISSION_FACTORS as unknown as MutableFactors
    let applied = 0
    for (const r of rows) {
      if (!F[r.key]) continue // engine only references known keys
      F[r.key] = { value: r.value, unit: r.unit, scope: r.scope, source: r.source, year: r.year, note: r.note ?? undefined }
      applied++
    }
    this.logger.log(`Applied ${applied} emission-factor overrides.`)
    return applied
  }

  list() {
    return this.prisma.emissionFactor.findMany({ orderBy: { key: 'asc' } })
  }

  async upsertOne(key: string, data: Partial<{ value: number; unit: string; scope: string; source: string; year: number; note: string }>) {
    if (data.value === undefined) throw new BadRequestException('value is required')
    const row = await this.prisma.emissionFactor.upsert({
      where: { key },
      update: data,
      create: {
        key, value: data.value, unit: data.unit ?? 'unit', scope: data.scope ?? 'scope3',
        source: data.source ?? 'manual', year: data.year ?? new Date().getFullYear(), note: data.note ?? null,
      },
    })
    await this.applyOverrides()
    return row
  }

  // CSV columns: key,value,unit,scope[,source,year,note]
  async upsertFromCsv(buffer?: Buffer) {
    if (!buffer || !buffer.length) throw new BadRequestException('No CSV file uploaded')
    const rows = parseCsv(buffer.toString('utf-8'))
    if (rows.length < 2) throw new BadRequestException('CSV needs a header row and at least one data row')

    const header = rows[0].map((h) => h.trim().toLowerCase())
    const col = (name: string) => header.indexOf(name)
    for (const required of ['key', 'value', 'unit', 'scope']) {
      if (col(required) < 0) throw new BadRequestException(`CSV missing required column: ${required}`)
    }

    const updated: string[] = []
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      const key = (r[col('key')] || '').trim()
      const value = parseFloat(r[col('value')])
      if (!key || Number.isNaN(value)) continue
      const data = {
        value,
        unit: (r[col('unit')] || '').trim() || 'unit',
        scope: (r[col('scope')] || 'scope3').trim(),
        source: col('source') >= 0 ? (r[col('source')] || 'CSV upload').trim() : 'CSV upload',
        year: col('year') >= 0 ? parseInt(r[col('year')], 10) || new Date().getFullYear() : new Date().getFullYear(),
        note: col('note') >= 0 ? (r[col('note')] || '').trim() || null : null,
      }
      await this.prisma.emissionFactor.upsert({ where: { key }, update: data, create: { key, ...data } })
      updated.push(key)
    }
    const appliedToEngine = await this.applyOverrides()
    return { updated: updated.length, keys: updated, appliedToEngine, note: 'Run a recalculation to refresh existing audits.' }
  }
}
