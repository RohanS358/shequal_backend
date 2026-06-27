import { Module } from '@nestjs/common'
import { EmissionFactorsService } from './emission-factors.service'
import { EmissionFactorsController } from './emission-factors.controller'

@Module({
  controllers: [EmissionFactorsController],
  providers: [EmissionFactorsService],
  exports: [EmissionFactorsService],
})
export class EmissionFactorsModule {}
