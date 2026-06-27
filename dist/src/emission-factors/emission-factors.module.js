"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmissionFactorsModule = void 0;
const common_1 = require("@nestjs/common");
const emission_factors_service_1 = require("./emission-factors.service");
const emission_factors_controller_1 = require("./emission-factors.controller");
let EmissionFactorsModule = class EmissionFactorsModule {
};
exports.EmissionFactorsModule = EmissionFactorsModule;
exports.EmissionFactorsModule = EmissionFactorsModule = __decorate([
    (0, common_1.Module)({
        controllers: [emission_factors_controller_1.EmissionFactorsController],
        providers: [emission_factors_service_1.EmissionFactorsService],
        exports: [emission_factors_service_1.EmissionFactorsService],
    })
], EmissionFactorsModule);
//# sourceMappingURL=emission-factors.module.js.map