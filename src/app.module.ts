import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import configuration from './config/configuration'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { SchoolsModule } from './schools/schools.module'
import { UsersModule } from './users/users.module'
import { StudentsModule } from './students/students.module'
import { RecommendationsModule } from './recommendations/recommendations.module'
import { LessonsModule } from './lessons/lessons.module'
import { EmissionFactorsModule } from './emission-factors/emission-factors.module'
import { CarbonCalculatorModule } from './carbon-calculator/carbon-calculator.module'
import { OmrModule } from './omr/omr.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    // Config — available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting — 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    SchoolsModule,
    UsersModule,
    StudentsModule,
    RecommendationsModule,
    LessonsModule,
    EmissionFactorsModule,
    CarbonCalculatorModule,
    OmrModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
