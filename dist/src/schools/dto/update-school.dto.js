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
exports.UpdateSchoolDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UpdateSchoolDto {
}
exports.UpdateSchoolDto = UpdateSchoolDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SchoolContactRole }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SchoolContactRole),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "contactRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "contactOther", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[+\d\s\-()]{7,20}$/, { message: 'Invalid phone number' }),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Province }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Province),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AreaType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AreaType),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "areaType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SchoolType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SchoolType),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "schoolType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.EnrollmentRange }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.EnrollmentRange),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "enrollment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ElectricityAvailability }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ElectricityAvailability),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "electricity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.InternetConnectivity }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.InternetConnectivity),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "connectivity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.PreferredLanguage }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PreferredLanguage),
    __metadata("design:type", String)
], UpdateSchoolDto.prototype, "language", void 0);
//# sourceMappingURL=update-school.dto.js.map