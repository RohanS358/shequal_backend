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
exports.OmrController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const omr_service_1 = require("./omr.service");
const carbon_calculator_service_1 = require("../carbon-calculator/carbon-calculator.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let OmrController = class OmrController {
    constructor(omr, carbon) {
        this.omr = omr;
        this.carbon = carbon;
    }
    scan(file, sheet) {
        return this.omr.scan(file, normalizeSheet(sheet));
    }
    async scanAndSubmit(file, academicYear, month, sheet, user) {
        const { audit } = await this.omr.scan(file, normalizeSheet(sheet));
        const dto = {
            academicYear: parseInt(academicYear, 10) || new Date().getFullYear(),
            month: month ? parseInt(month, 10) : 0,
            ...audit,
        };
        return this.carbon.submitAudit(user.schoolId, user.id, dto);
    }
};
exports.OmrController = OmrController;
__decorate([
    (0, common_1.Post)('scan'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SCHOOL_ADMIN, client_1.UserRole.TEACHER, client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Scan a filled OMR sheet (school|student) and return decoded answers + audit payload' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('sheet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OmrController.prototype, "scan", null);
__decorate([
    (0, common_1.Post)('scan-and-submit'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SCHOOL_ADMIN, client_1.UserRole.TEACHER, client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Scan a school sheet and submit it as a carbon audit in one step' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('academicYear')),
    __param(2, (0, common_1.Body)('month')),
    __param(3, (0, common_1.Body)('sheet')),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], OmrController.prototype, "scanAndSubmit", null);
exports.OmrController = OmrController = __decorate([
    (0, swagger_1.ApiTags)('OMR Scanning'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('omr'),
    __metadata("design:paramtypes", [omr_service_1.OmrService,
        carbon_calculator_service_1.CarbonCalculatorService])
], OmrController);
function normalizeSheet(sheet) {
    return sheet === 'student' ? 'student' : 'school';
}
//# sourceMappingURL=omr.controller.js.map