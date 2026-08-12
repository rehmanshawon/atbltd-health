import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CommissionStatus } from '../../entities/commission.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  async findAll(
    @Query('agentId') agentId?: string,
    @Query('status') status?: CommissionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commissionService.findAll({ agentId, status, page, limit });
  }

  @Get('agent/:agentId/summary')
  async getAgentSummary(@Param('agentId') agentId: string) {
    return this.commissionService.getAgentCommissionSummary(agentId);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commissionService.approveCommission(id, user.sub);
  }

  @Post(':id/confirm-payment')
  async confirmPayment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commissionService.confirmCommissionPayment(id, user.sub);
  }

  @Post(':id/reverse')
  async reverse(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('reason') reason: string,
  ) {
    return this.commissionService.reverseCommission(id, user.sub, reason);
  }
}
