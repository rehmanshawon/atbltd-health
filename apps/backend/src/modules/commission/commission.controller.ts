import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CommissionStatus } from '../../entities/commission.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AgentService } from '../agent/agent.service';
@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
export class CommissionController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly agentService: AgentService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER, UserRole.AGENT)
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('agentId') agentId?: string,
    @Query('status') status?: CommissionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return this.commissionService.findAll({
        agentId,
        status,
        page: pageNum,
        limit: limitNum,
        reviewerRole: user.role,
      });
    }

    // Owner/Agent: only their own commissions
    const agent = await this.agentService.getAgentByUserId(user.sub);
    if (!agent) return { commissions: [], total: 0, page: pageNum, totalPages: 1 };
    return this.commissionService.findAll({
      agentId: agent.id,
      status,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('agent/:agentId/summary')
  async getAgentSummary(@Param('agentId') agentId: string) {
    return this.commissionService.getAgentCommissionSummary(agentId);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commissionService.approveCommission(id, user.sub, user.role);
  }

  @Post(':id/decline')
  @Roles(UserRole.SUPER_ADMIN)
  async decline(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('reason') reason?: string,
  ) {
    return this.commissionService.declineCommission(id, user.sub, user.role, reason);
  }

  @Post(':id/confirm-payment')
  async confirmPayment(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
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
