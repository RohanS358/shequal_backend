import { Controller, Get, Post, Patch, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { StudentsService } from './students.service'
import { QuestCompleteDto, UpdateProfileDto } from './dto/quest-complete.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get('me/progress')
  @ApiOperation({ summary: 'Get my pet progress (created at zero if new)' })
  getProgress(@CurrentUser('id') userId: string) {
    return this.students.getOrCreate(userId)
  }

  @Post('me/quest-complete')
  @ApiOperation({ summary: 'Bank a finished daily quest (adds XP, grows the pet)' })
  completeQuest(@CurrentUser('id') userId: string, @Body() dto: QuestCompleteDto) {
    return this.students.completeQuest(userId, dto)
  }

  @Post('me/lesson-complete')
  @ApiOperation({ summary: 'Mark a lesson complete' })
  completeLesson(@CurrentUser('id') userId: string) {
    return this.students.completeLesson(userId)
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update my pet profile (species / happiness)' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.students.updateProfile(userId, dto)
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top students by XP (carbon-leader score). ?scope=global for all schools.' })
  leaderboard(@CurrentUser('schoolId') schoolId: string, @Query('scope') scope?: string) {
    return this.students.leaderboard(scope === 'global' ? undefined : schoolId)
  }

  @Get('standings/class')
  @ApiOperation({ summary: 'My class ranked by pet experience (rank 1 = Carbon Hero)' })
  classStandings(@CurrentUser('id') userId: string) {
    return this.students.classStandings(userId)
  }

  @Get('standings/school')
  @ApiOperation({ summary: 'My whole school ranked by pet experience (rank 1 = Super Carbon Hero)' })
  schoolStandings(@CurrentUser('id') userId: string) {
    return this.students.schoolStandings(userId)
  }
}
