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
exports.IndividualRegisterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class IndividualRegisterDto {
}
exports.IndividualRegisterDto = IndividualRegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sita Thapa' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], IndividualRegisterDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'sita@gmail.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], IndividualRegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz123', description: 'Id of the registered school the student belongs to' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IndividualRegisterDto.prototype, "schoolId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'I want to help reduce my school carbon footprint' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], IndividualRegisterDto.prototype, "whyInterested", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Student@1234', description: 'Min 8 characters — creates your login account' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], IndividualRegisterDto.prototype, "password", void 0);
//# sourceMappingURL=individual-register.dto.js.map