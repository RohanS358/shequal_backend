import { Module } from '@nestjs/common'
import { OmrService } from './omr.service'
import { OmrController } from './omr.controller'
import { CarbonCalculatorModule } from '../carbon-calculator/carbon-calculator.module'

// OMR runs as an in-process child service: NestJS spawns the Python
// OMRChecker per request (no separate server). See omr.service.ts.
@Module({
  imports: [CarbonCalculatorModule],
  providers: [OmrService],
  controllers: [OmrController],
  exports: [OmrService],
})
export class OmrModule {}
