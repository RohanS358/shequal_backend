import { AuthService } from './auth.service';
import { SchoolStep1Dto } from './dto/school-step1.dto';
import { SchoolStep2Dto } from './dto/school-step2.dto';
import { SchoolStep3Dto } from './dto/school-step3.dto';
import { IndividualRegisterDto } from './dto/individual-register.dto';
import { LoginDto } from './dto/login.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    schoolStep1(dto: SchoolStep1Dto): Promise<{
        draftId: string;
        message: string;
    }>;
    schoolStep2(draftId: string, dto: SchoolStep2Dto): Promise<{
        draftId: string;
        message: string;
    }>;
    schoolStep3(draftId: string, dto: SchoolStep3Dto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        school: {
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.SchoolStatus;
            accessMode: import(".prisma/client").$Enums.AccessMode;
        };
    }>;
    individualRegister(dto: IndividualRegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            school: {
                id: string;
                name: string;
            };
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            school: {
                id: string;
                name: string;
                status: import(".prisma/client").$Enums.SchoolStatus;
                accessMode: import(".prisma/client").$Enums.AccessMode;
            };
        };
    }>;
    studentLogin(dto: StudentLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            className: string;
            rollNo: string;
            school: {
                id: string;
                name: string;
                status: import(".prisma/client").$Enums.SchoolStatus;
            };
        };
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    refresh(dto: RefreshTokenDto, userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        lastLoginAt: Date;
        createdAt: Date;
        school: {
            id: string;
            name: string;
            slug: string;
            province: import(".prisma/client").$Enums.Province;
            district: string;
            status: import(".prisma/client").$Enums.SchoolStatus;
            accessMode: import(".prisma/client").$Enums.AccessMode;
        };
    }>;
}
