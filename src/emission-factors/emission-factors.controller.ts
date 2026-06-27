import { Controller, Get, Patch, Post, Param, Body, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { EmissionFactorsService } from './emission-factors.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@prisma/client'

interface UploadedCsv { buffer: Buffer; originalname?: string }

@ApiTags('Emission Factors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emission-factors')
export class EmissionFactorsController {
  constructor(private readonly factors: EmissionFactorsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'List the effective emission factors (config + DB overrides)' })
  list() {
    return this.factors.list()
  }

  @Post('upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Upload a CSV (key,value,unit,scope[,source,year,note]) to customise factors' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: UploadedCsv) {
    return this.factors.upsertFromCsv(file?.buffer)
  }

  @Patch(':key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a single emission factor' })
  update(@Param('key') key: string, @Body() body: { value: number; unit?: string; scope?: string; source?: string; year?: number; note?: string }) {
    return this.factors.upsertOne(key, body)
  }
}
