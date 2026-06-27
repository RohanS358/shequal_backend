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
var EmissionFactorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmissionFactorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const emission_factors_config_1 = require("../carbon-calculator/config/emission-factors.config");
function parseCsv(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                }
                else
                    inQuotes = false;
            }
            else
                field += c;
        }
        else if (c === '"')
            inQuotes = true;
        else if (c === ',') {
            row.push(field);
            field = '';
        }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n')
                i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        }
        else
            field += c;
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
let EmissionFactorsService = EmissionFactorsService_1 = class EmissionFactorsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmissionFactorsService_1.name);
    }
    async onModuleInit() {
        try {
            await this.seedIfEmpty();
            await this.applyOverrides();
        }
        catch (e) {
            this.logger.warn(`Emission-factor init skipped: ${e.message}`);
        }
    }
    async seedIfEmpty() {
        const count = await this.prisma.emissionFactor.count();
        if (count > 0)
            return;
        const entries = Object.entries(emission_factors_config_1.EMISSION_FACTORS);
        for (const [key, f] of entries) {
            await this.prisma.emissionFactor.create({
                data: { key, value: f.value, unit: f.unit, scope: f.scope, source: f.source, year: f.year, note: f.note ?? null },
            });
        }
        this.logger.log(`Seeded ${entries.length} emission factors.`);
    }
    async applyOverrides() {
        const rows = await this.prisma.emissionFactor.findMany();
        const F = emission_factors_config_1.EMISSION_FACTORS;
        let applied = 0;
        for (const r of rows) {
            if (!F[r.key])
                continue;
            F[r.key] = { value: r.value, unit: r.unit, scope: r.scope, source: r.source, year: r.year, note: r.note ?? undefined };
            applied++;
        }
        this.logger.log(`Applied ${applied} emission-factor overrides.`);
        return applied;
    }
    list() {
        return this.prisma.emissionFactor.findMany({ orderBy: { key: 'asc' } });
    }
    async upsertOne(key, data) {
        if (data.value === undefined)
            throw new common_1.BadRequestException('value is required');
        const row = await this.prisma.emissionFactor.upsert({
            where: { key },
            update: data,
            create: {
                key, value: data.value, unit: data.unit ?? 'unit', scope: data.scope ?? 'scope3',
                source: data.source ?? 'manual', year: data.year ?? new Date().getFullYear(), note: data.note ?? null,
            },
        });
        await this.applyOverrides();
        return row;
    }
    async upsertFromCsv(buffer) {
        if (!buffer || !buffer.length)
            throw new common_1.BadRequestException('No CSV file uploaded');
        const rows = parseCsv(buffer.toString('utf-8'));
        if (rows.length < 2)
            throw new common_1.BadRequestException('CSV needs a header row and at least one data row');
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const col = (name) => header.indexOf(name);
        for (const required of ['key', 'value', 'unit', 'scope']) {
            if (col(required) < 0)
                throw new common_1.BadRequestException(`CSV missing required column: ${required}`);
        }
        const updated = [];
        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            const key = (r[col('key')] || '').trim();
            const value = parseFloat(r[col('value')]);
            if (!key || Number.isNaN(value))
                continue;
            const data = {
                value,
                unit: (r[col('unit')] || '').trim() || 'unit',
                scope: (r[col('scope')] || 'scope3').trim(),
                source: col('source') >= 0 ? (r[col('source')] || 'CSV upload').trim() : 'CSV upload',
                year: col('year') >= 0 ? parseInt(r[col('year')], 10) || new Date().getFullYear() : new Date().getFullYear(),
                note: col('note') >= 0 ? (r[col('note')] || '').trim() || null : null,
            };
            await this.prisma.emissionFactor.upsert({ where: { key }, update: data, create: { key, ...data } });
            updated.push(key);
        }
        const appliedToEngine = await this.applyOverrides();
        return { updated: updated.length, keys: updated, appliedToEngine, note: 'Run a recalculation to refresh existing audits.' };
    }
};
exports.EmissionFactorsService = EmissionFactorsService;
exports.EmissionFactorsService = EmissionFactorsService = EmissionFactorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmissionFactorsService);
//# sourceMappingURL=emission-factors.service.js.map