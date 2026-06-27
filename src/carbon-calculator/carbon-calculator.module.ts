import { Module } from '@nestjs/common'
import { CarbonCalculatorService } from './carbon-calculator.service'
import { CarbonCalculatorController } from './carbon-calculator.controller'
import { RecommendationsModule } from '../recommendations/recommendations.module'

// The calculation engine is a set of pure functions (engine/*) driven by
// the central emission-factors config — no per-strategy providers needed.
// RecommendationsModule supplies the DB-editable content for school advice.
@Module({
  imports: [RecommendationsModule],
  providers: [CarbonCalculatorService],
  controllers: [CarbonCalculatorController],
  exports: [CarbonCalculatorService],
})
export class CarbonCalculatorModule {}
