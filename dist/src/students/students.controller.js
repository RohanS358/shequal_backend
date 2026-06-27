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
exports.StudentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const students_service_1 = require("./students.service");
const quest_complete_dto_1 = require("./dto/quest-complete.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let StudentsController = class StudentsController {
    constructor(students) {
        this.students = students;
    }
    getProgress(userId) {
        return this.students.getOrCreate(userId);
    }
    completeQuest(userId, dto) {
        return this.students.completeQuest(userId, dto);
    }
    completeLesson(userId) {
        return this.students.completeLesson(userId);
    }
    updateProfile(userId, dto) {
        return this.students.updateProfile(userId, dto);
    }
    leaderboard(schoolId, scope) {
        return this.students.leaderboard(scope === 'global' ? undefined : schoolId);
    }
    classStandings(userId) {
        return this.students.classStandings(userId);
    }
    schoolStandings(userId) {
        return this.students.schoolStandings(userId);
    }
};
exports.StudentsController = StudentsController;
__decorate([
    (0, common_1.Get)('me/progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my pet progress (created at zero if new)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Post)('me/quest-complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Bank a finished daily quest (adds XP, grows the pet)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quest_complete_dto_1.QuestCompleteDto]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "completeQuest", null);
__decorate([
    (0, common_1.Post)('me/lesson-complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a lesson complete' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "completeLesson", null);
__decorate([
    (0, common_1.Patch)('me/profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update my pet profile (species / happiness)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quest_complete_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Top students by XP (carbon-leader score). ?scope=global for all schools.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('schoolId')),
    __param(1, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "leaderboard", null);
__decorate([
    (0, common_1.Get)('standings/class'),
    (0, swagger_1.ApiOperation)({ summary: 'My class ranked by pet experience (rank 1 = Carbon Hero)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "classStandings", null);
__decorate([
    (0, common_1.Get)('standings/school'),
    (0, swagger_1.ApiOperation)({ summary: 'My whole school ranked by pet experience (rank 1 = Super Carbon Hero)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "schoolStandings", null);
exports.StudentsController = StudentsController = __decorate([
    (0, swagger_1.ApiTags)('Students'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('students'),
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentsController);
//# sourceMappingURL=students.controller.js.map