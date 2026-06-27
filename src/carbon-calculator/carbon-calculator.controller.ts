import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { CarbonCalculatorService } from './carbon-calculator.service'
import { SubmitAuditDto } from './dto/submit-audit.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UserRole } from '@prisma/client'

@ApiTags('Carbon Audits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('carbon-audits')
export class CarbonCalculatorController {
  constructor(private readonly service: CarbonCalculatorService) {}

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Submit / update a carbon audit — calculation runs automatically' })
  submit(@CurrentUser() user: any, @Body() dto: SubmitAuditDto) {
    return this.service.submitAudit(user.schoolId, user.id, dto)
  }

  @Get('school/:schoolId')
  @ApiOperation({ summary: 'List all audits for a school' })
  findBySchool(@Param('schoolId') schoolId: string, @CurrentUser() user: any) {
    return this.service.findBySchool(schoolId, user)
  }

  @Get('my-school')
  @ApiOperation({ summary: 'List audits for the current user\'s school' })
  findMine(@CurrentUser() user: any) {
    return this.service.findBySchool(user.schoolId, user)
  }

  @Get('leaderboard')
  @Public()
  @ApiOperation({ summary: 'Public leaderboard — schools ranked by lowest emissions per student' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  leaderboard(@Query('limit') limit?: number) {
    return this.service.getLeaderboard(limit ? parseInt(String(limit)) : 10)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit with full result breakdown' })
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user)
  }

  @Post(':id/recalculate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Re-run calculation on existing audit (admin — use after updating emission factors)' })
  recalculate(@Param('id') id: string) {
    return this.service.recalculate(id)
  }
}
