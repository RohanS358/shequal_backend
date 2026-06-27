import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateSchoolDto } from './dto/update-school.dto'
import { UserRole, SchoolStatus } from '@prisma/client'

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { province?: string; status?: string; page?: number; limit?: number }) {
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (query.province) where.province = query.province
    if (query.status) where.status = query.status

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
    ])

    return { schools, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findById(id: string) {
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
    })
    if (!school) throw new NotFoundException('School not found')
    return school
  }

  async findBySlug(slug: string) {
    const school = await this.prisma.school.findUnique({ where: { slug } })
    if (!school) throw new NotFoundException('School not found')
    return school
  }

  async update(id: string, dto: UpdateSchoolDto, requestingUser: { id: string; role: UserRole; schoolId?: string }) {
    const school = await this.prisma.school.findUnique({ where: { id } })
    if (!school) throw new NotFoundException('School not found')

    // Only super admin or the school's own admin can update
    const isSuperAdmin = requestingUser.role === UserRole.SUPER_ADMIN
    const isOwnSchool = requestingUser.schoolId === id && requestingUser.role === UserRole.SCHOOL_ADMIN

    if (!isSuperAdmin && !isOwnSchool) {
      throw new ForbiddenException('You can only update your own school')
    }

    return this.prisma.school.update({ where: { id }, data: dto })
  }

  async getUsers(schoolId: string) {
    return this.prisma.user.findMany({
      where: { schoolId },
      select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Admin: approve or reject a school registration
  async updateStatus(id: string, status: SchoolStatus, accessMode?: string) {
    const school = await this.prisma.school.findUnique({ where: { id } })
    if (!school) throw new NotFoundException('School not found')

    return this.prisma.school.update({
      where: { id },
      data: {
        status,
        ...(accessMode ? { accessMode: accessMode as any } : {}),
      },
    })
  }

  async search(q: string) {
    const trimmed = q?.trim() ?? ''
    const notRejected = { notIn: [SchoolStatus.REJECTED, SchoolStatus.SUSPENDED] } as any
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
    })
  }

  async getStats() {
    const [total, byStatus, byProvince] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.groupBy({ by: ['status'], _count: true }),
      this.prisma.school.groupBy({ by: ['province'], _count: true, orderBy: { _count: { province: 'desc' } } }),
    ])
    return { total, byStatus, byProvince }
  }
}
