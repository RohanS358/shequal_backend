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
exports.SubmitAuditDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class SubmitAuditDto {
}
exports.SubmitAuditDto = SubmitAuditDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2024, description: 'Academic year of the audit' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SubmitAuditDto.prototype, "academicYear", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'Month (1-12) for monthly audits, 0 / omit for annual' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(12),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SubmitAuditDto.prototype, "month", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 320, description: 'Enrolled student count (for per-student intensity & proxies)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SubmitAuditDto.prototype, "enrollment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'URBAN', description: 'URBAN | PERI_URBAN | RURAL — defaults to the school record' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitAuditDto.prototype, "areaType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Electricity (Scope 2). Tier1: measuredKwh. Tier2: proxyHoursPerDay+proxyRooms[+proxyWattsPerRoom]. solarKwp optional offset.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "electricity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Generator fuel (Scope 1). Tier1: measuredLitres. Tier2: proxyHoursPerDay+proxyKva[+proxyDaysPerYear]. hasGenerator enables Tier3.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "generator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'School vehicle fuel (Scope 1). measuredLitres + fuelType(diesel|petrol).' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "vehicle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cooking fuel (Scope 1). lpgKg and/or firewoodKg.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "cooking", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Refrigerant (Scope 1). acUnits count.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "refrigerant", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Commuting (Scope 3). Tier1: modes[{mode,pct,oneWayKm}]. Tier2: dominantMode+avgDistanceKm.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "commute", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Paper (Scope 3). Tier1: measuredKg or reamsPerMonth. Else per-student proxy.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "paper", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Food/canteen (Scope 3). hasCanteen + measuredMealsPerYear (Tier1) or mealsPerDay (Tier2).' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "food", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Waste (Scope 3). Tier1: measuredKgPerWeek. treatment{landfill,burning,composting,recycling} %% split, else segregation/composting/recycling reduce landfill.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "waste", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Water (Scope 3, minor). litresPerYear (Tier1) or billNprPerYear (Tier2); source gravity→0, else pumped proxy.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "water", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Custom emission factor overrides: factor key → kg CO₂e per unit. Applied only for this calculation; global defaults are restored immediately after.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAuditDto.prototype, "customFactors", void 0);
//# sourceMappingURL=submit-audit.dto.js.map