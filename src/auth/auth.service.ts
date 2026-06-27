import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcryptjs'
import { SchoolStatus, UserRole, AccessMode, IndividualRole } from '@prisma/client'
import { SchoolStep1Dto } from './dto/school-step1.dto'
import { SchoolStep2Dto } from './dto/school-step2.dto'
import { SchoolStep3Dto } from './dto/school-step3.dto'
import { IndividualRegisterDto } from './dto/individual-register.dto'
import { LoginDto } from './dto/login.dto'
import { StudentLoginDto } from './dto/student-login.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ----------------------------------------------------------------
  // SCHOOL REGISTRATION — Step 1
  // Creates a draft and returns the draftId to the frontend.
  // ----------------------------------------------------------------
  async schoolRegisterStep1(dto: SchoolStep1Dto) {
    // Check if email already exists in schools or drafts
    const [existingSchool, existingUser] = await Promise.all([
      this.prisma.school.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { email: dto.email } }),
    ])

    if (existingSchool || existingUser) {
      throw new ConflictException('An account with this email already exists')
    }

    // Hash password early (stored in draft, used in step 3)
    const hashedPassword = await bcrypt.hash(dto.password, 12)

    const ttlHours = this.configService.get<number>('draftTtlHours')
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)

    // Upsert draft — allows retrying step 1 with the same email
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
        // Store hashed password as a JSON extra field via contactOther piggyback? No —
        // we'll use a separate approach: store it temporarily in a safe field.
        // Using contactOther as a safe temp store would be wrong.
        // Instead we'll add a _passwordHash field to the Prisma model.
        // Since we can't alter schema now, we store it encoded in `phone` prefix...
        // Actually: let's just store the hash. We add it to the schema.
        // For simplicity, store password hash in contactOther with a marker prefix.
        // A better approach: store in a dedicated column (added below via JSON approach).
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
    })

    // Store hashed password out-of-band in a simple key-value cache approach.
    // We'll keep it in memory for this service instance (fine for single-instance Render free tier).
    // For multi-instance: use Redis or a separate DB table.
    this._draftPasswords.set(draft.id, hashedPassword)

    return { draftId: draft.id, message: 'Step 1 complete. Proceed to step 2.' }
  }

  // In-process password cache for draft registrations (single instance)
  private readonly _draftPasswords = new Map<string, string>()

  // ----------------------------------------------------------------
  // SCHOOL REGISTRATION — Step 2
  // ----------------------------------------------------------------
  async schoolRegisterStep2(draftId: string, dto: SchoolStep2Dto) {
    const draft = await this.getValidDraft(draftId)

    await this.prisma.schoolRegistrationDraft.update({
      where: { id: draftId },
      data: {
        province: dto.province,
        district: dto.district,
        areaType: dto.areaType,
        schoolType: dto.schoolType,
        currentStep: 2,
      },
    })

    return { draftId, message: 'Step 2 complete. Proceed to step 3.' }
  }

  // ----------------------------------------------------------------
  // SCHOOL REGISTRATION — Step 3 (finalize)
  // Creates School + User records, returns JWT.
  // ----------------------------------------------------------------
  async schoolRegisterStep3(draftId: string, dto: SchoolStep3Dto) {
    const draft = await this.getValidDraft(draftId)

    if (!draft.schoolName || !draft.contactName || !draft.email || !draft.province) {
      throw new BadRequestException('Registration is incomplete. Please complete steps 1 and 2 first.')
    }

    const hashedPassword = this._draftPasswords.get(draftId)
    if (!hashedPassword) {
      throw new BadRequestException('Registration session expired. Please start over.')
    }

    // Determine access mode based on connectivity + electricity
    const accessMode = this.determineAccessMode(dto.connectivity, dto.electricity)

    // Generate a URL-friendly slug
    const slug = this.generateSlug(draft.schoolName, draft.district)

    // Create School + User in a transaction
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
          status: SchoolStatus.PENDING,
          accessMode,
        },
      })

      const user = await tx.user.create({
        data: {
          email: draft.email,
          password: hashedPassword,
          name: draft.contactName,
          role: UserRole.SCHOOL_ADMIN,
          schoolId: school.id,
        },
      })

      // Clean up the draft
      await tx.schoolRegistrationDraft.delete({ where: { id: draftId } })

      return { school, user }
    })

    this._draftPasswords.delete(draftId)

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)

    return {
      message: 'Registration complete! Your school profile is under review.',
      school: {
        id: school.id,
        name: school.name,
        status: school.status,
        accessMode: school.accessMode,
      },
      ...tokens,
    }
  }

  // ----------------------------------------------------------------
  // INDIVIDUAL REGISTRATION
  // Creates both an Individual record (newsletter/profile) and a
  // User account so the person can log in to the student portal.
  // ----------------------------------------------------------------
  async individualRegister(dto: IndividualRegisterDto) {
    // A student must join an existing, registered school.
    const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } })
    if (!school) {
      throw new NotFoundException('Selected school not found. Please pick a registered school.')
    }

    const [existingIndividual, existingUser] = await Promise.all([
      this.prisma.individual.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { email: dto.email } }),
    ])

    if (existingIndividual || existingUser) {
      throw new ConflictException('This email is already registered')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12)

    const { user } = await this.prisma.$transaction(async (tx) => {
      await tx.individual.create({
        data: {
          name: dto.name,
          email: dto.email,
          role: IndividualRole.STUDENT,
          school: school.name,
          whyInterested: dto.whyInterested,
          isSubscribed: true,
        },
      })

      // Student login account, bound to the chosen school's portal.
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: UserRole.STUDENT,
          schoolId: school.id,
        },
      })

      return { user }
    })

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)

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
    }
  }

  // ----------------------------------------------------------------
  // STUDENT LOGIN (passwordless)
  // A student is identified within a school by (class, rollNo). First entry
  // auto-creates a passwordless account. The pet/leaderboard "experience" lives
  // on the StudentProfile (created lazily by the students module).
  // ----------------------------------------------------------------
  async studentLogin(dto: StudentLoginDto) {
    const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } })
    if (!school) {
      throw new NotFoundException('School not found. Please pick a registered school.')
    }

    const className = dto.className.trim()
    const rollNo = dto.rollNo.trim()
    if (!className || !rollNo) {
      throw new BadRequestException('Class and roll number are required.')
    }

    let user = await this.prisma.user.findFirst({
      where: { schoolId: dto.schoolId, className, rollNo, role: UserRole.STUDENT },
    })

    if (!user) {
      const name = (dto.name || '').trim() || `Roll ${rollNo}`
      user = await this.prisma.user.create({
        data: { name, role: UserRole.STUDENT, schoolId: dto.schoolId, className, rollNo },
      })
    } else if (dto.name && dto.name.trim() && dto.name.trim() !== user.name) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { name: dto.name.trim() } })
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const tokens = await this.generateTokens(user.id, user.email ?? undefined, user.role, user.schoolId ?? undefined)

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
    }
  }

  // ----------------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------------
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { school: { select: { id: true, name: true, status: true, accessMode: true } } },
    })

    if (!user) throw new UnauthorizedException('Invalid email or password')
    if (!user.isActive) throw new UnauthorizedException('Your account has been deactivated')

    const isPasswordValid = await bcrypt.compare(dto.password, user.password)
    if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password')

    // School-scoped login: if the user reached login via "search your school",
    // the account must belong to that school. (Super admins are exempt.)
    if (
      dto.schoolId &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.schoolId !== dto.schoolId
    ) {
      throw new UnauthorizedException(
        'This account is not registered with the selected school. Please choose your own school.',
      )
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
      },
      ...tokens,
    }
  }

  // ----------------------------------------------------------------
  // REFRESH TOKEN
  // ----------------------------------------------------------------
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.refreshToken) throw new UnauthorizedException()

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token')

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.schoolId)
    return tokens
  }

  // ----------------------------------------------------------------
  // LOGOUT — clear refresh token
  // ----------------------------------------------------------------
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
    return { message: 'Logged out successfully' }
  }

  // ----------------------------------------------------------------
  // GET ME
  // ----------------------------------------------------------------
  async getMe(userId: string) {
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
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  // ----------------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------------
  private async generateTokens(userId: string, email: string | undefined, role: string, schoolId?: string) {
    const payload = { sub: userId, email, role, schoolId }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ])

    // Store hashed refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefresh },
    })

    return { accessToken, refreshToken }
  }

  private async getValidDraft(draftId: string) {
    const draft = await this.prisma.schoolRegistrationDraft.findUnique({ where: { id: draftId } })
    if (!draft) throw new NotFoundException('Registration session not found')
    if (draft.expiresAt < new Date()) {
      await this.prisma.schoolRegistrationDraft.delete({ where: { id: draftId } })
      throw new BadRequestException('Registration session expired. Please start over.')
    }
    return draft
  }

  private determineAccessMode(
    connectivity: string,
    electricity: string,
  ): AccessMode {
    if (connectivity === 'RELIABLE') return AccessMode.ONLINE
    if (connectivity === 'NONE' || electricity === 'NO_GRID') return AccessMode.OFFLINE
    return AccessMode.HYBRID
  }

  private generateSlug(schoolName: string, district: string): string {
    const base = `${schoolName}-${district}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)
    return `${base}-${Date.now().toString(36)}`
  }
}
