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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
const client_1 = require("@prisma/client");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this._draftPasswords = new Map();
    }
    async schoolRegisterStep1(dto) {
        const [existingSchool, existingUser] = await Promise.all([
            this.prisma.school.findUnique({ where: { email: dto.email } }),
            this.prisma.user.findUnique({ where: { email: dto.email } }),
        ]);
        if (existingSchool || existingUser) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const ttlHours = this.configService.get('draftTtlHours');
        const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
        const draft = await this.prisma.schoolRegistrationDraft.upsert({
            where: { email: dto.email },
            update: {
                schoolName: dto.schoolName,
                contactName: dto.contactName,
                contactRole: dto.contactRole,
                contactOther: dto.contactOther,
                phone: dto.phone,
                currentStep: 1,
                expiresAt,
            },
            create: {
                schoolName: dto.schoolName,
                contactName: dto.contactName,
                contactRole: dto.contactRole,
                contactOther: dto.contactOther,
                email: dto.email,
                phone: dto.phone,
                currentStep: 1,
                expiresAt,
            },
        });
        this._draftPasswords.set(draft.id, hashedPassword);
        return { draftId: draft.id, message: 'Step 1 complete. Proceed to step 2.' };
    }
    async schoolRegisterStep2(draftId, dto) {
        const draft = await this.getValidDraft(draftId);
        await this.prisma.schoolRegistrationDraft.update({
            where: { id: draftId },
            data: {
                province: dto.province,
                district: dto.district,
                areaType: dto.areaType,
                schoolType: dto.schoolType,
                currentStep: 2,
            },
        });
        return { draftId, message: 'Step 2 complete. Proceed to step 3.' };
    }
    async schoolRegisterStep3(draftId, dto) {
        const draft = await this.getValidDraft(draftId);
        if (!draft.schoolName || !draft.contactName || !draft.email || !draft.province) {
            throw new common_1.BadRequestException('Registration is incomplete. Please complete steps 1 and 2 first.');
        }
        const hashedPassword = this._draftPasswords.get(draftId);
        if (!hashedPassword) {
            throw new common_1.BadRequestException('Registration session expired. Please start over.');
        }
        const accessMode = this.determineAccessMode(dto.connectivity, dto.electricity);
        const slug = this.generateSlug(draft.schoolName, draft.district);
        const { school, user } = await this.prisma.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: {
                    name: draft.schoolName,
                    slug,
                    contactName: draft.contactName,
                    contactRole: draft.contactRole,
                    contactOther: draft.contactOther,
                    email: draft.email,
                    phone: draft.phone,
                    province: draft.province,
                    district: draft.district,
                    areaType: draft.areaType,
                    schoolType: draft.schoolType,
                    enrollment: dto.enrollment,
                    electricity: dto.electricity,
                    connectivity: dto.connectivity,
                    language: dto.language,
                    status: client_1.SchoolStatus.PENDING,
                    accessMode,
                },
            });
            const user = await tx.user.create({
                data: {
                    email: draft.email,
                    password: hashedPassword,
                    name: draft.contactName,
                    role: client_1.UserRole.SCHOOL_ADMIN,
                    schoolId: school.id,
                },
            });
            await tx.schoolRegistrationDraft.delete({ where: { id: draftId } });
            return { school, user };
        });
        this._draftPasswords.delete(draftId);
        const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId);
        return {
            message: 'Registration complete! Your school profile is under review.',
            school: {
                id: school.id,
                name: school.name,
                status: school.status,
                accessMode: school.accessMode,
            },
            ...tokens,
        };
    }
    async individualRegister(dto) {
        const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } });
        if (!school) {
            throw new common_1.NotFoundException('Selected school not found. Please pick a registered school.');
        }
        const [existingIndividual, existingUser] = await Promise.all([
            this.prisma.individual.findUnique({ where: { email: dto.email } }),
            this.prisma.user.findUnique({ where: { email: dto.email } }),
        ]);
        if (existingIndividual || existingUser) {
            throw new common_1.ConflictException('This email is already registered');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const { user } = await this.prisma.$transaction(async (tx) => {
            await tx.individual.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    role: client_1.IndividualRole.STUDENT,
                    school: school.name,
                    whyInterested: dto.whyInterested,
                    isSubscribed: true,
                },
            });
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    name: dto.name,
                    role: client_1.UserRole.STUDENT,
                    schoolId: school.id,
                },
            });
            return { user };
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId);
        return {
            message: 'Registration complete! Welcome to CoPaila.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                school: { id: school.id, name: school.name },
            },
            ...tokens,
        };
    }
    async studentLogin(dto) {
        const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } });
        if (!school) {
            throw new common_1.NotFoundException('School not found. Please pick a registered school.');
        }
        const className = dto.className.trim();
        const rollNo = dto.rollNo.trim();
        if (!className || !rollNo) {
            throw new common_1.BadRequestException('Class and roll number are required.');
        }
        let user = await this.prisma.user.findFirst({
            where: { schoolId: dto.schoolId, className, rollNo, role: client_1.UserRole.STUDENT },
        });
        if (!user) {
            const name = (dto.name || '').trim() || `Roll ${rollNo}`;
            user = await this.prisma.user.create({
                data: { name, role: client_1.UserRole.STUDENT, schoolId: dto.schoolId, className, rollNo },
            });
        }
        else if (dto.name && dto.name.trim() && dto.name.trim() !== user.name) {
            user = await this.prisma.user.update({ where: { id: user.id }, data: { name: dto.name.trim() } });
        }
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const tokens = await this.generateTokens(user.id, user.email ?? undefined, user.role, user.schoolId ?? undefined);
        return {
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                className: user.className,
                rollNo: user.rollNo,
                school: { id: school.id, name: school.name, status: school.status },
            },
            ...tokens,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { school: { select: { id: true, name: true, status: true, accessMode: true } } },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid email or password');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Your account has been deactivated');
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid)
            throw new common_1.UnauthorizedException('Invalid email or password');
        if (dto.schoolId &&
            user.role !== client_1.UserRole.SUPER_ADMIN &&
            user.schoolId !== dto.schoolId) {
            throw new common_1.UnauthorizedException('This account is not registered with the selected school. Please choose your own school.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                school: user.school,
            },
            ...tokens,
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.refreshToken)
            throw new common_1.UnauthorizedException();
        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId);
        return tokens;
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        return { message: 'Logged out successfully' };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                lastLoginAt: true,
                createdAt: true,
                school: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        province: true,
                        district: true,
                        status: true,
                        accessMode: true,
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async generateTokens(userId, email, role, schoolId) {
        const payload = { sub: userId, email, role, schoolId };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.secret'),
                expiresIn: this.configService.get('jwt.expiresIn'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.refreshSecret'),
                expiresIn: this.configService.get('jwt.refreshExpiresIn'),
            }),
        ]);
        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefresh },
        });
        return { accessToken, refreshToken };
    }
    async getValidDraft(draftId) {
        const draft = await this.prisma.schoolRegistrationDraft.findUnique({ where: { id: draftId } });
        if (!draft)
            throw new common_1.NotFoundException('Registration session not found');
        if (draft.expiresAt < new Date()) {
            await this.prisma.schoolRegistrationDraft.delete({ where: { id: draftId } });
            throw new common_1.BadRequestException('Registration session expired. Please start over.');
        }
        return draft;
    }
    determineAccessMode(connectivity, electricity) {
        if (connectivity === 'RELIABLE')
            return client_1.AccessMode.ONLINE;
        if (connectivity === 'NONE' || electricity === 'NO_GRID')
            return client_1.AccessMode.OFFLINE;
        return client_1.AccessMode.HYBRID;
    }
    generateSlug(schoolName, district) {
        const base = `${schoolName}-${district}`
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 80);
        return `${base}-${Date.now().toString(36)}`;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map