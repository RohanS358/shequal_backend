import { PrismaService } from '../prisma/prisma.service';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UserRole, SchoolStatus } from '@prisma/client';
export declare class SchoolsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: {
        province?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        schools: {
            id: string;
            name: string;
            createdAt: Date;
            slug: string;
            province: import(".prisma/client").$Enums.Province;
            district: string;
            areaType: import(".prisma/client").$Enums.AreaType;
            schoolType: import(".prisma/client").$Enums.SchoolType;
            enrollment: import(".prisma/client").$Enums.EnrollmentRange;
            status: import(".prisma/client").$Enums.SchoolStatus;
            accessMode: import(".prisma/client").$Enums.AccessMode;
            _count: {
                carbonAudits: number;
            };
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<{
        carbonAudits: ({
            result: {
                id: string;
                recommendations: import("@prisma/client/runtime/library").JsonValue;
                auditId: string;
                scope1Emissions: number;
                scope2Emissions: number;
                scope3Emissions: number;
                totalEmissions: number;
                emissionsPerStudent: number | null;
                tier1Pct: number;
                tier2Pct: number;
                tier3Pct: number;
                confidenceScore: number;
                partiallyDefault: boolean;
                breakdown: import("@prisma/client/runtime/library").JsonValue;
                grade: string | null;
                calculatedAt: Date;
            };
        } & {
            id: string;
            schoolId: string;
            createdAt: Date;
            updatedAt: Date;
            enrollment: number;
            status: import(".prisma/client").$Enums.AuditStatus;
            academicYear: number;
            month: number;
            submittedById: string | null;
        })[];
        _count: {
            users: number;
            carbonAudits: number;
        };
    } & {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        contactName: string;
        contactRole: import(".prisma/client").$Enums.SchoolContactRole;
        contactOther: string | null;
        phone: string | null;
        province: import(".prisma/client").$Enums.Province;
        district: string;
        areaType: import(".prisma/client").$Enums.AreaType;
        schoolType: import(".prisma/client").$Enums.SchoolType;
        enrollment: import(".prisma/client").$Enums.EnrollmentRange;
        electricity: import(".prisma/client").$Enums.ElectricityAvailability;
        connectivity: import(".prisma/client").$Enums.InternetConnectivity;
        language: import(".prisma/client").$Enums.PreferredLanguage;
        status: import(".prisma/client").$Enums.SchoolStatus;
        accessMode: import(".prisma/client").$Enums.AccessMode | null;
    }>;
    findBySlug(slug: string): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        contactName: string;
        contactRole: import(".prisma/client").$Enums.SchoolContactRole;
        contactOther: string | null;
        phone: string | null;
        province: import(".prisma/client").$Enums.Province;
        district: string;
        areaType: import(".prisma/client").$Enums.AreaType;
        schoolType: import(".prisma/client").$Enums.SchoolType;
        enrollment: import(".prisma/client").$Enums.EnrollmentRange;
        electricity: import(".prisma/client").$Enums.ElectricityAvailability;
        connectivity: import(".prisma/client").$Enums.InternetConnectivity;
        language: import(".prisma/client").$Enums.PreferredLanguage;
        status: import(".prisma/client").$Enums.SchoolStatus;
        accessMode: import(".prisma/client").$Enums.AccessMode | null;
    }>;
    update(id: string, dto: UpdateSchoolDto, requestingUser: {
        id: string;
        role: UserRole;
        schoolId?: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        contactName: string;
        contactRole: import(".prisma/client").$Enums.SchoolContactRole;
        contactOther: string | null;
        phone: string | null;
        province: import(".prisma/client").$Enums.Province;
        district: string;
        areaType: import(".prisma/client").$Enums.AreaType;
        schoolType: import(".prisma/client").$Enums.SchoolType;
        enrollment: import(".prisma/client").$Enums.EnrollmentRange;
        electricity: import(".prisma/client").$Enums.ElectricityAvailability;
        connectivity: import(".prisma/client").$Enums.InternetConnectivity;
        language: import(".prisma/client").$Enums.PreferredLanguage;
        status: import(".prisma/client").$Enums.SchoolStatus;
        accessMode: import(".prisma/client").$Enums.AccessMode | null;
    }>;
    getUsers(schoolId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLoginAt: Date;
        createdAt: Date;
    }[]>;
    updateStatus(id: string, status: SchoolStatus, accessMode?: string): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        contactName: string;
        contactRole: import(".prisma/client").$Enums.SchoolContactRole;
        contactOther: string | null;
        phone: string | null;
        province: import(".prisma/client").$Enums.Province;
        district: string;
        areaType: import(".prisma/client").$Enums.AreaType;
        schoolType: import(".prisma/client").$Enums.SchoolType;
        enrollment: import(".prisma/client").$Enums.EnrollmentRange;
        electricity: import(".prisma/client").$Enums.ElectricityAvailability;
        connectivity: import(".prisma/client").$Enums.InternetConnectivity;
        language: import(".prisma/client").$Enums.PreferredLanguage;
        status: import(".prisma/client").$Enums.SchoolStatus;
        accessMode: import(".prisma/client").$Enums.AccessMode | null;
    }>;
    search(q: string): Promise<{
        id: string;
        name: string;
        slug: string;
        province: import(".prisma/client").$Enums.Province;
        district: string;
        schoolType: import(".prisma/client").$Enums.SchoolType;
        enrollment: import(".prisma/client").$Enums.EnrollmentRange;
        status: import(".prisma/client").$Enums.SchoolStatus;
    }[]>;
    getStats(): Promise<{
        total: number;
        byStatus: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.SchoolGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
        byProvince: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.SchoolGroupByOutputType, "province"[]> & {
            _count: number;
        })[];
    }>;
}
