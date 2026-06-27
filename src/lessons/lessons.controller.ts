import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { LessonsService } from './lessons.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the lesson roadmap with my completion + lock state' })
  list(@CurrentUser('id') userId: string) {
    return this.lessons.listForUser(userId)
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a lesson (awards XP once)' })
  complete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.lessons.complete(userId, id)
  }
}
