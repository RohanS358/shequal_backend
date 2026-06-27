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
exports.SchoolStep3Dto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class SchoolStep3Dto {
}
exports.SchoolStep3Dto = SchoolStep3Dto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.EnrollmentRange, example: client_1.EnrollmentRange.RANGE_100_500 }),
    (0, class_validator_1.IsEnum)(client_1.EnrollmentRange),
    __metadata("design:type", String)
], SchoolStep3Dto.prototype, "enrollment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ElectricityAvailability, example: client_1.ElectricityAvailability.LOAD_SHEDDING }),
    (0, class_validator_1.IsEnum)(client_1.ElectricityAvailability),
    __metadata("design:type", String)
], SchoolStep3Dto.prototype, "electricity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.InternetConnectivity, example: client_1.InternetConnectivity.INTERMITTENT }),
    (0, class_validator_1.IsEnum)(client_1.InternetConnectivity),
    __metadata("design:type", String)
], SchoolStep3Dto.prototype, "connectivity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PreferredLanguage, example: client_1.PreferredLanguage.ENGLISH }),
    (0, class_validator_1.IsEnum)(client_1.PreferredLanguage),
    __metadata("design:type", String)
], SchoolStep3Dto.prototype, "language", void 0);
//# sourceMappingURL=school-step3.dto.js.map