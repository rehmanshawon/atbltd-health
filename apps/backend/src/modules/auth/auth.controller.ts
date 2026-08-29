import { Controller, Post, Put, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Public endpoint - Step 1: Register with payment info
   * Replaces the mock enrollment modal
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Public endpoint - Step 2: Login with mobile and password
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/send-otp
   * Public endpoint - Send OTP to mobile number
   */
  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body('mobileNumber') mobileNumber: string) {
    return this.authService.sendOtp(mobileNumber);
  }

  /**
   * POST /auth/verify-otp
   * Public endpoint - Verify OTP and get JWT token
   */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  /**
   * GET /auth/profile
   * Protected endpoint - Get current user's profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  /**
   * GET /auth/me
   * Protected endpoint - Quick check of current session
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return {
      memberId: user.memberId,
      role: user.role,
      mobileNumber: user.mobileNumber,
    };
  }

  /**
   * POST /api/auth/member-login — Login with only Member ID
   */
  @Public()
  @Post('member-login')
  @HttpCode(HttpStatus.OK)
  async memberLogin(@Body('memberId') memberId: string) {
    return this.authService.memberLogin(memberId);
  }

  @Public()
  @Post('staff-login-otp')
  @HttpCode(HttpStatus.OK)
  async sendStaffLoginOtp(@Body('staffId') staffId: string) {
    return this.authService.sendStaffLoginOtp(staffId);
  }

  @Public()
  @Post('staff-login-verify')
  @HttpCode(HttpStatus.OK)
  async verifyStaffOtp(@Body('staffId') staffId: string, @Body('otp') otp: string) {
    return this.authService.verifyStaffOtp(staffId, otp);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { mobileNumber?: string; email?: string; fullName?: string },
  ) {
    return this.authService.updateProfile(user.sub, body);
  }
}
