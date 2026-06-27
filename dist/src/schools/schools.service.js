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
exports.SchoolsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SchoolsService = class SchoolsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (query.province)
            where.province = query.province;
        if (query.status)
            where.status = query.status;
        const [schools, total] = await Promise.all([
            this.prisma.school.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, name: true, slug: true, province: true, district: true,
                    areaType: true, schoolType: true, enrollment: true, status: true,
                    accessMode: true, createdAt: true,
                    _count: { select: { carbonAudits: true } },
                },
            }),
            this.prisma.school.count({ where }),
        ]);
        return { schools, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findById(id) {
        const school = await this.prisma.school.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, carbonAudits: true } },
                carbonAudits: {
                    take: 5,
                    orderBy: { academicYear: 'desc' },
                    include: { result: true },
                },
            },
        });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        return school;
    }
    async findBySlug(slug) {
        const school = await this.prisma.school.findUnique({ where: { slug } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        return school;
    }
    async update(id, dto, requestingUser) {
        const school = await this.prisma.school.findUnique({ where: { id } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        const isSuperAdmin = requestingUser.role === client_1.UserRole.SUPER_ADMIN;
        const isOwnSchool = requestingUser.schoolId === id && requestingUser.role === client_1.UserRole.SCHOOL_ADMIN;
        if (!isSuperAdmin && !isOwnSchool) {
            throw new common_1.ForbiddenException('You can only update your own school');
        }
        return this.prisma.school.update({ where: { id }, data: dto });
    }
    async getUsers(schoolId) {
        return this.prisma.user.findMany({
            where: { schoolId },
            select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, status, accessMode) {
        const school = await this.prisma.school.findUnique({ where: { id } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        return this.prisma.school.update({
            where: { id },
            data: {
                status,
                ...(accessMode ? { accessMode: accessMode } : {}),
            },
        });
    }
    async search(q) {
        const trimmed = q?.trim() ?? '';
        const notRejected = { notIn: [client_1.SchoolStatus.REJECTED, client_1.SchoolStatus.SUSPENDED] };
        return this.prisma.school.findMany({
            where: trimmed.length > 0
                ? { name: { contains: trimmed, mode: 'insensitive' }, status: notRejected }
                : { status: notRejected },
            select: {
                id: true, name: true, slug: true,
                district: true, province: true,
                schoolType: true, enrollment: true, status: true,
            },
            take: 8,
            orderBy: { name: 'asc' },
        });
    }
    async getStats() {
        const [total, byStatus, byProvince] = await Promise.all([
            this.prisma.school.count(),
            this.prisma.school.groupBy({ by: ['status'], _count: true }),
            this.prisma.school.groupBy({ by: ['province'], _count: true, orderBy: { _count: { province: 'desc' } } }),
        ]);
        return { total, byStatus, byProvince };
    }
};
exports.SchoolsService = SchoolsService;
exports.SchoolsService = SchoolsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SchoolsService);
//# sourceMappingURL=schools.service.js.map