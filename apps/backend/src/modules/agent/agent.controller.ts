import { Controller, Get, Post, Put, Param, Body, UseGuards, Query } from '@nestjs/common';
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  async createAgent(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      fullName: string;
      mobileNumber: string;
      email?: string;
      // password: string;
      role: UserRole.OWNER | UserRole.AGENT;
      commissionRate: number;
      parentAgentCode?: string;
    },
  ) {
    return this.agentService.createAgent(body, user.sub);
  }

  /**
   * GET /api/agents — Get all agents (Admin only)
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  async getAllAgents(@CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return this.agentService.getAgentsOnly(); // New method
    }
    const agent = await this.agentService.getAgentByUserId(user.sub);
    if (!agent) return [];
    return this.agentService.getAgentsByParent(agent.id);
  }

  /**
   * GET /api/agents/my-agents — Owner gets their sub-agents
   */
  @Get('my-agents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.AGENT)
  async getMyAgents(@CurrentUser() user: JwtPayload) {
    const agent = await this.agentService.getAgentByUserId(user.sub);
    if (!agent) return [];
    return this.agentService.getAgentsByParent(agent.id);
  }

  /**
   * GET /api/agents/me — Get current user's agent profile
   */
  @Get('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.AGENT)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.agentService.getAgentByUserId(user.sub);
  }

  /**
   * PUT /api/agents/:id/deactivate — Deactivate an agent
   */
  @Put(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  async deactivateAgent(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.agentService.requestDeactivation(id, user.sub, user.role);
  }

  /**
   * GET /api/agents/owners — SA/Admin gets all owners only
   */
  @Get('owners')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getOwners() {
    const agents = await this.agentService.getAllAgents();
    return agents.filter((a) => a.user?.role === UserRole.OWNER);
  }

  /**
   * GET /api/agents/pending-approvals — SA/Admin
   */
  @Get('pending-approvals')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPendingApprovals(@CurrentUser() user: JwtPayload) {
    return this.agentService.getPendingApprovals(user.role);
  }

  /**
   * PUT /api/agents/:id/approve — SA/Admin
   */
  @Put(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async approveAgent(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.agentService.approveAgent(id, user.sub, user.role);
  }

  /**
   * PUT /api/agents/:id/request-deactivation — SA/Admin/Owner
   */
  @Put(':id/request-deactivation')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  async requestDeactivation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.agentService.requestDeactivation(id, user.sub, user.role);
  }

  /**
   * PUT /api/agents/:id/approve-deactivation — SA/Admin
   */
  @Put(':id/approve-deactivation')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async approveDeactivation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.agentService.approveDeactivation(id, user.sub, user.role);
  }
}
