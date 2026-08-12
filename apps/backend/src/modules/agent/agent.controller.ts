import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * POST /api/agents — Admin/Owner creates a new agent/owner
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async createAgent(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      fullName: string;
      mobileNumber: string;
      email?: string;
      password: string;
      role: UserRole.OWNER | UserRole.AGENT;
      commissionRate: number;
      parentAgentId?: string;
    },
  ) {
    return this.agentService.createAgent(body, user.sub);
  }

  /**
   * GET /api/agents — Get all agents (Admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getAllAgents() {
    return this.agentService.getAllAgents();
  }

  /**
   * GET /api/agents/my-agents — Owner gets their sub-agents
   */
  @Get('my-agents')
  @Roles(UserRole.OWNER, UserRole.AGENT)
  async getMyAgents(@CurrentUser() user: JwtPayload) {
    const agent = await this.agentService.getAgentByUserId(user.sub);
    if (!agent) return [];
    return this.agentService.getAgentsByParent(agent.id);
  }

  /**
   * GET /api/agents/me — Get current user's agent profile
   */
  @Get('me')
  @Roles(UserRole.OWNER, UserRole.AGENT)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.agentService.getAgentByUserId(user.sub);
  }

  /**
   * PUT /api/agents/:id/deactivate — Deactivate an agent
   */
  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivateAgent(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.agentService.deactivateAgent(id, user.sub);
  }
}
