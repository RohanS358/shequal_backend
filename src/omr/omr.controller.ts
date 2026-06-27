import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { OmrService, UploadedImage, SheetType } from './omr.service'
import { CarbonCalculatorService } from '../carbon-calculator/carbon-calculator.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UserRole } from '@prisma/client'

@ApiTags('OMR Scanning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('omr')
export class OmrController {
  constructor(
    private readonly omr: OmrService,
    private readonly carbon: CarbonCalculatorService,
  ) {}

  // Scan only — returns the mapped audit payload for the user to review/edit
  // before submitting through the normal /carbon-audits endpoint.
  @Post('scan')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Scan a filled OMR sheet (school|student) and return decoded answers + audit payload' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  scan(@UploadedFile() file: UploadedImage, @Body('sheet') sheet?: string) {
    return this.omr.scan(file, normalizeSheet(sheet))
  }

  // Scan + immediately submit/calculate (school sheet only).
  @Post('scan-and-submit')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Scan a school sheet and submit it as a carbon audit in one step' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async scanAndSubmit(
    @UploadedFile() file: UploadedImage,
    @Body('academicYear') academicYear: string,
    @Body('month') month: string,
    @Body('sheet') sheet: string,
    @CurrentUser() user: { id: string; schoolId: string },
  ) {
    const { audit } = await this.omr.scan(file, normalizeSheet(sheet))
    const dto = {
      academicYear: parseInt(academicYear, 10) || new Date().getFullYear(),
      month: month ? parseInt(month, 10) : 0,
      ...(audit as object),
    }
    return this.carbon.submitAudit(user.schoolId, user.id, dto as never)
  }
}

function normalizeSheet(sheet?: string): SheetType {
  return sheet === 'student' ? 'student' : 'school'
}
