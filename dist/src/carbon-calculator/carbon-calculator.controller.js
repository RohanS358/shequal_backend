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
exports.CarbonCalculatorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const carbon_calculator_service_1 = require("./carbon-calculator.service");
const submit_audit_dto_1 = require("./dto/submit-audit.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let CarbonCalculatorController = class CarbonCalculatorController {
    constructor(service) {
        this.service = service;
    }
    submit(user, dto) {
        return this.service.submitAudit(user.schoolId, user.id, dto);
    }
    findBySchool(schoolId, user) {
        return this.service.findBySchool(schoolId, user);
    }
    findMine(user) {
        return this.service.findBySchool(user.schoolId, user);
    }
    leaderboard(limit) {
        return this.service.getLeaderboard(limit ? parseInt(String(limit)) : 10);
    }
    findById(id, user) {
        return this.service.findById(id, user);
    }
    recalculate(id) {
        return this.service.recalculate(id);
    }
};
exports.CarbonCalculatorController = CarbonCalculatorController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SCHOOL_ADMIN, client_1.UserRole.TEACHER, client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Submit / update a carbon audit — calculation runs automatically' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_audit_dto_1.SubmitAuditDto]),
    __metadata("design:returntype", void 0)
], CarbonCalculatorController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)('school/:schoolId'),
    (0, swagger_1.ApiOperation)({ summary: 'List all audits for a school' }),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CarbonCalculatorController.prototype, "findBySchool", null);
__decorate([
    (0, common_1.Get)('my-school'),
    (0, swagger_1.ApiOperation)({ summary: 'List audits for the current user\'s school' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CarbonCalculatorController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Public leaderboard — schools ranked by lowest emissions per student' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CarbonCalculatorController.prototype, "leaderboard", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single audit with full result breakdown' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CarbonCalculatorController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(':id/recalculate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Re-run calculation on existing audit (admin — use after updating emission factors)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CarbonCalculatorController.prototype, "recalculate", null);
exports.CarbonCalculatorController = CarbonCalculatorController = __decorate([
    (0, swagger_1.ApiTags)('Carbon Audits'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('carbon-audits'),
    __metadata("design:paramtypes", [carbon_calculator_service_1.CarbonCalculatorService])
], CarbonCalculatorController);
//# sourceMappingURL=carbon-calculator.controller.js.map