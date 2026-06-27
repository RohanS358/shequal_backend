"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmrModule = void 0;
const common_1 = require("@nestjs/common");
const omr_service_1 = require("./omr.service");
const omr_controller_1 = require("./omr.controller");
const carbon_calculator_module_1 = require("../carbon-calculator/carbon-calculator.module");
let OmrModule = class OmrModule {
};
exports.OmrModule = OmrModule;
exports.OmrModule = OmrModule = __decorate([
    (0, common_1.Module)({
        imports: [carbon_calculator_module_1.CarbonCalculatorModule],
        providers: [omr_service_1.OmrService],
        controllers: [omr_controller_1.OmrController],
        exports: [omr_service_1.OmrService],
    })
], OmrModule);
//# sourceMappingURL=omr.module.js.map