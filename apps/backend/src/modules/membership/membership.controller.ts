import { Controller, Get, UseGuards } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('membership')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  /**
   * GET /api/membership/dashboard
   * Full member dashboard data
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.membershipService.getMemberDashboard(user.sub);
  }

  /**
   * GET /api/membership/status
   * Lightweight membership status check
   */
  @Get('status')
  async getStatus(@CurrentUser() user: JwtPayload) {
    return this.membershipService.getMembershipStatus(user.sub);
  }

  /**
   * GET /api/membership/digital-card
   * Digital membership card data
   */
  @Get('digital-card')
  async getDigitalCard(@CurrentUser() user: JwtPayload) {
    const dashboard = await this.membershipService.getMemberDashboard(user.sub);
    return dashboard.digitalCard;
  }
}
