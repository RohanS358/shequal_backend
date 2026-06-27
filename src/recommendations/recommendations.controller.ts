import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { RecommendationsService } from './recommendations.service'
import { QuestAnswersDto, CreateRecommendationDto, UpdateRecommendationDto } from './dto/recommendation.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { RecAudience, UserRole } from '@prisma/client'

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recs: RecommendationsService) {}

  // Student-facing: today's answers → tomorrow's actions (any logged-in user).
  @Post('quest')
  @ApiOperation({ summary: "Get tomorrow's recommendations from a day's quest answers" })
  forQuest(@Body() dto: QuestAnswersDto) {
    return this.recs.forStudent(dto.answers)
  }

  // ── Admin editing ──
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'List recommendations (optionally by audience)' })
  list(@Query('audience') audience?: RecAudience) {
    return this.recs.list(audience)
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a recommendation' })
  create(@Body() dto: CreateRecommendationDto) {
    return this.recs.create(dto)
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a recommendation' })
  update(@Param('id') id: string, @Body() dto: UpdateRecommendationDto) {
    return this.recs.update(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete a recommendation' })
  remove(@Param('id') id: string) {
    return this.recs.remove(id)
  }
}
