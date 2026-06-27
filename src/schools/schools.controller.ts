import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { SchoolsService } from './schools.service'
import { UpdateSchoolDto } from './dto/update-school.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UserRole, SchoolStatus } from '@prisma/client'

@ApiTags('Schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Public school name search — used by the landing page SearchBar' })
  @ApiQuery({ name: 'q', required: true, description: 'School name (min 2 chars)' })
  search(@Query('q') q: string) {
    return this.schoolsService.search(q)
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all schools (admin only)' })
  @ApiQuery({ name: 'province', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: { province?: string; status?: string; page?: number; limit?: number }) {
    return this.schoolsService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'School registration statistics (admin only)' })
  getStats() {
    return this.schoolsService.getStats()
  }

  @Get('me')
  @ApiOperation({ summary: "Get the current user's school profile" })
  getMySchool(@CurrentUser() user: any) {
    if (!user.schoolId) return null
    return this.schoolsService.findById(user.schoolId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get school by ID' })
  findById(@Param('id') id: string) {
    return this.schoolsService.findById(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update school profile' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser() user: any,
  ) {
    return this.schoolsService.update(id, dto, user)
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'List users belonging to a school' })
  getUsers(@Param('id') id: string) {
    return this.schoolsService.getUsers(id)
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve / reject a school registration (admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: SchoolStatus; accessMode?: string },
  ) {
    return this.schoolsService.updateStatus(id, body.status, body.accessMode)
  }
}
