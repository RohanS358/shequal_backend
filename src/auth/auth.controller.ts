import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { SchoolStep1Dto } from './dto/school-step1.dto'
import { SchoolStep2Dto } from './dto/school-step2.dto'
import { SchoolStep3Dto } from './dto/school-step3.dto'
import { IndividualRegisterDto } from './dto/individual-register.dto'
import { LoginDto } from './dto/login.dto'
import { StudentLoginDto } from './dto/student-login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { Public } from './decorators/public.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------------------------------------------------------------
  // SCHOOL REGISTRATION — 3-step flow
  // ---------------------------------------------------------------

  @Public()
  @Post('register/school/step1')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 attempts per minute per IP
  @ApiOperation({ summary: 'School registration — Step 1 (Identity + password)' })
  schoolStep1(@Body() dto: SchoolStep1Dto) {
    return this.authService.schoolRegisterStep1(dto)
  }

  @Public()
  @Post('register/school/step2/:draftId')
  @ApiOperation({ summary: 'School registration — Step 2 (Location)' })
  @ApiParam({ name: 'draftId', description: 'Draft ID returned from step 1' })
  schoolStep2(@Param('draftId') draftId: string, @Body() dto: SchoolStep2Dto) {
    return this.authService.schoolRegisterStep2(draftId, dto)
  }

  @Public()
  @Post('register/school/step3/:draftId')
  @ApiOperation({ summary: 'School registration — Step 3 (Operations) — finalizes registration' })
  @ApiParam({ name: 'draftId', description: 'Draft ID returned from step 1' })
  schoolStep3(@Param('draftId') draftId: string, @Body() dto: SchoolStep3Dto) {
    return this.authService.schoolRegisterStep3(draftId, dto)
  }

  // ---------------------------------------------------------------
  // INDIVIDUAL REGISTRATION
  // ---------------------------------------------------------------

  @Public()
  @Post('register/individual')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Individual / student registration (no login account created)' })
  individualRegister(@Body() dto: IndividualRegisterDto) {
    return this.authService.individualRegister(dto)
  }

  // ---------------------------------------------------------------
  // LOGIN / LOGOUT / REFRESH
  // ---------------------------------------------------------------

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Login with email + password (staff)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Public()
  @Post('student-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Passwordless student entry by school + class + roll no (auto-creates on first entry)' })
  studentLogin(@Body() dto: StudentLoginDto) {
    return this.authService.studentLogin(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — invalidates refresh token' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() dto: RefreshTokenDto, @CurrentUser('id') userId: string) {
    return this.authService.refreshTokens(userId, dto.refreshToken)
  }

  // ---------------------------------------------------------------
  // ME
  // ---------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId)
  }
}
