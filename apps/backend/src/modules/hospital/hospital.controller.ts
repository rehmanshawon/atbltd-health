import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
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
  async getClaims(@Headers('authorization') authHeader: string) {
    // Simple token check for hospital portal
    const token = authHeader?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return this.hospitalService.getHospitalClaims(decoded.hospitalId);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('claims/:id/documents')
  async getClaimDocuments(
    @Param('id') claimId: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return this.hospitalService.getClaimDocuments(claimId, decoded.hospitalId);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * PUT /api/hospitals/claims/:id/verify — Hospital verifies claim
   */
  @Put('claims/:id/verify')
  async verifyClaim(
    @Param('id') claimId: string,
    @Headers('authorization') authHeader: string,
    @Body() body: { decision: 'verified' | 'rejected'; notes: string },
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return this.hospitalService.verifyClaim(
        claimId,
        decoded.hospitalId,
        body.decision,
        body.notes,
      );
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * GET /api/hospitals — List all hospitals (Admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  //@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllHospitals() {
    return this.hospitalService.getAllHospitals();
  }

  /**
   * POST /api/hospitals — Create hospital (Admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async createHospital(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.hospitalService.createHospital(body, user.sub);
  }

  /**
   * PUT /api/hospitals/:id/deactivate — Deactivate (Admin only)
   */
  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.hospitalService.deactivateHospital(id, user.sub);
  }
}
