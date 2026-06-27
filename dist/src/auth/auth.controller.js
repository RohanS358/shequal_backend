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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const school_step1_dto_1 = require("./dto/school-step1.dto");
const school_step2_dto_1 = require("./dto/school-step2.dto");
const school_step3_dto_1 = require("./dto/school-step3.dto");
const individual_register_dto_1 = require("./dto/individual-register.dto");
const login_dto_1 = require("./dto/login.dto");
const student_login_dto_1 = require("./dto/student-login.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const public_decorator_1 = require("./decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    schoolStep1(dto) {
        return this.authService.schoolRegisterStep1(dto);
    }
    schoolStep2(draftId, dto) {
        return this.authService.schoolRegisterStep2(draftId, dto);
    }
    schoolStep3(draftId, dto) {
        return this.authService.schoolRegisterStep3(draftId, dto);
    }
    individualRegister(dto) {
        return this.authService.individualRegister(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
    studentLogin(dto) {
        return this.authService.studentLogin(dto);
    }
    logout(userId) {
        return this.authService.logout(userId);
    }
    refresh(dto, userId) {
        return this.authService.refreshTokens(userId, dto.refreshToken);
    }
    getMe(userId) {
        return this.authService.getMe(userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register/school/step1'),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'School registration — Step 1 (Identity + password)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [school_step1_dto_1.SchoolStep1Dto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "schoolStep1", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register/school/step2/:draftId'),
    (0, swagger_1.ApiOperation)({ summary: 'School registration — Step 2 (Location)' }),
    (0, swagger_1.ApiParam)({ name: 'draftId', description: 'Draft ID returned from step 1' }),
    __param(0, (0, common_1.Param)('draftId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, school_step2_dto_1.SchoolStep2Dto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "schoolStep2", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register/school/step3/:draftId'),
    (0, swagger_1.ApiOperation)({ summary: 'School registration — Step 3 (Operations) — finalizes registration' }),
    (0, swagger_1.ApiParam)({ name: 'draftId', description: 'Draft ID returned from step 1' }),
    __param(0, (0, common_1.Param)('draftId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, school_step3_dto_1.SchoolStep3Dto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "schoolStep3", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register/individual'),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 10 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Individual / student registration (no login account created)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [individual_register_dto_1.IndividualRegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "individualRegister", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 10 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email + password (staff)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('student-login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Passwordless student entry by school + class + roll no (auto-creates on first entry)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [student_login_dto_1.StudentLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "studentLogin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout — invalidates refresh token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token using refresh token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map