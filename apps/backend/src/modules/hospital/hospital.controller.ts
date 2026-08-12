import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('hospitals')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  /**
   * POST /api/hospitals/login — Hospital portal login
   */
  @Public()
  @Post('login')
  async login(@Body() body: { loginId: string; password: string }) {
    return this.hospitalService.hospitalLogin(body.loginId, body.password);
  }

  /**
   * GET /api/hospitals/claims — Claims for verification
   */
  @Get('claims')
  @UseGuards(JwtAuthGuard)
  async getClaims(@CurrentUser() user: any) {
    return this.hospitalService.getHospitalClaims(user.hospitalId);
  }

  /**
   * PUT /api/hospitals/claims/:id/verify — Hospital verifies claim
   */
  @Put('claims/:id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyClaim(
    @Param('id') claimId: string,
    @CurrentUser() user: any,
    @Body() body: { decision: 'verified' | 'rejected'; notes: string },
  ) {
    return this.hospitalService.verifyClaim(
      claimId,
      user.hospitalId,
      body.decision,
      body.notes,
    );
  }

  /**
   * GET /api/hospitals — List all hospitals (Admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllHospitals() {
    return this.hospitalService.getAllHospitals();
  }

  /**
   * POST /api/hospitals — Create hospital (Admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createHospital(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.hospitalService.createHospital(body, user.sub);
  }

  /**
   * PUT /api/hospitals/:id/deactivate — Deactivate (Admin only)
   */
  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.hospitalService.deactivateHospital(id, user.sub);
  }
}
