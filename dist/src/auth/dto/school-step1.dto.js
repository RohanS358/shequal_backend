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
exports.SchoolStep1Dto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class SchoolStep1Dto {
}
exports.SchoolStep1Dto = SchoolStep1Dto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Green Valley School' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SchoolStep1Dto.prototype, "schoolName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ram Sharma' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SchoolStep1Dto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.SchoolContactRole, example: client_1.SchoolContactRole.PRINCIPAL }),
    (0, class_validator_1.IsEnum)(client_1.SchoolContactRole),
    __metadata("design:type", String)
], SchoolStep1Dto.prototype, "contactRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Deputy Principal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], SchoolStep1Dto.prototype, "contactOther", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'principal@greenvalley.edu.np' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SchoolStep1Dto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+977-1-5552345' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[+\d\s\-()]{7,20}$/, { message: 'Invalid phone number format' }),
    __metadata("design:type", String)
], SchoolStep1Dto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'School@1234', description: 'Min 8 chars, used to create the school admin account' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], SchoolStep1Dto.prototype, "password", void 0);
//# sourceMappingURL=school-step1.dto.js.map