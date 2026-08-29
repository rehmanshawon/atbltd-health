import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentApprovalStatus } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AgentApprovalService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly notificationService: NotificationService,
    private readonly smsService: SmsService,
  ) {}

  async approveAgent(agentId: string, adminId: string, adminRole: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });

    if (!agent) throw new NotFoundException('Agent not found');

    if (adminRole === UserRole.SUPER_ADMIN) {
      agent.approvalStatus = AgentApprovalStatus.ACTIVE;
      agent.isActive = true;
      if (agent.user) {
        agent.user.isActive = true;
        await this.userRepository.save(agent.user);
      }
    } else if (adminRole === UserRole.ADMIN) {
      if (agent.approvalStatus === AgentApprovalStatus.PENDING) {
        agent.approvalStatus = AgentApprovalStatus.APPROVED_BY_ADMIN;
      } else {
        throw new BadRequestException('Invalid approval state');
      }
    } else {
      throw new BadRequestException('Only Admin or Super Admin can approve');
    }

    const saved = await this.agentRepository.save(agent);

    // SMS on SA final approval
    if (
      adminRole === UserRole.SUPER_ADMIN &&
      saved.approvalStatus === AgentApprovalStatus.ACTIVE &&
      saved.user?.mobileNumber
    ) {
      const password = saved.plainPassword || 'Contact support';
      if (saved.user.role === UserRole.OWNER) {
        await this.smsService.sendSms(
          saved.user.mobileNumber,
          `ATB Ltd এ OWNER ID হোল্ডার হিসেবে আপনাকে স্বাগতম। আপনার OWNER ID: ${saved.agentCode}, আপনার পাসওয়ার্ড: ${password}`,
        );
      } else if (saved.user.role === UserRole.AGENT) {
        await this.smsService.sendSms(
          saved.user.mobileNumber,
          `ATB Ltd এ AGENT হিসেবে আপনাকে স্বাগতম। আপনার AGENT ID: ${saved.agentCode}, আপনার পাসওয়ার্ড: ${password}`,
        );
      }
      saved.plainPassword = null;
      await this.agentRepository.save(saved);
    }

    // Notifications
    if (
      adminRole === UserRole.ADMIN &&
      saved.approvalStatus === AgentApprovalStatus.APPROVED_BY_ADMIN
    ) {
      await this.notificationService.notifyRoles(
        [UserRole.SUPER_ADMIN],
        NotificationType.SYSTEM_ALERT,
        'Agent Approved by Admin — Final Approval Needed',
        `${saved.agentCode} approved by Admin. SA final approval required.`,
        '/admin/approvals',
        agentId,
      );
    }

    if (adminRole === UserRole.SUPER_ADMIN) {
      await this.notificationService.notifyRoles(
        [UserRole.ADMIN],
        NotificationType.SYSTEM_ALERT,
        'Agent Fully Approved',
        `${saved.agentCode} has been fully approved by SA.`,
        '/admin/agents',
        agentId,
      );
    }

    await this.auditLogRepository.save({
      action: 'AGENT_APPROVED',
      entity: 'Agent',
      entityId: agentId,
      performedById: adminId,
      newValue: {
        agentCode: agent.agentCode,
        approvalStatus: saved.approvalStatus,
        approvedByRole: adminRole,
      },
    });

    return saved;
  }

  async requestDeactivation(
    agentId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });

    if (!agent) throw new NotFoundException('Agent not found');

    if (requesterRole === UserRole.SUPER_ADMIN) {
      agent.isActive = false;
      agent.approvalStatus = AgentApprovalStatus.DEACTIVATED;
      if (agent.user) {
        agent.user.isActive = false;
        await this.userRepository.save(agent.user);
      }
    } else if (requesterRole === UserRole.ADMIN) {
      agent.approvalStatus = AgentApprovalStatus.DEACTIVATION_PENDING;
    } else if (requesterRole === UserRole.OWNER) {
      if (agent.parentAgentId !== requesterId) {
        throw new ForbiddenException('You can only deactivate your own agents');
      }
      agent.approvalStatus = AgentApprovalStatus.DEACTIVATION_PENDING;
    } else {
      throw new ForbiddenException('You do not have permission to deactivate');
    }

    return this.agentRepository.save(agent);
  }

  async approveDeactivation(agentId: string, adminId: string, adminRole: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });

    if (!agent) throw new NotFoundException('Agent not found');

    if (adminRole === UserRole.SUPER_ADMIN) {
      agent.approvalStatus = AgentApprovalStatus.DEACTIVATED;
      agent.isActive = false;
      if (agent.user) {
        agent.user.isActive = false;
        await this.userRepository.save(agent.user);
      }
    } else if (adminRole === UserRole.ADMIN) {
      agent.approvalStatus = AgentApprovalStatus.DEACTIVATION_APPROVED_BY_ADMIN;
    } else {
      throw new BadRequestException('Only Admin or Super Admin can approve deactivation');
    }

    return this.agentRepository.save(agent);
  }

  async getPendingApprovals(userRole: string): Promise<{
    pendingCreates: Agent[];
    pendingDeactivations: Agent[];
  }> {
    let createWhere: any[] = [];
    let deactivationWhere: any[] = [];

    if (userRole === UserRole.ADMIN) {
      createWhere = [{ approvalStatus: AgentApprovalStatus.PENDING }];
      deactivationWhere = [{ approvalStatus: AgentApprovalStatus.DEACTIVATION_PENDING }];
    } else if (userRole === UserRole.SUPER_ADMIN) {
      createWhere = [{ approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN }];
      deactivationWhere = [{ approvalStatus: AgentApprovalStatus.DEACTIVATION_APPROVED_BY_ADMIN }];
    }

    const pendingCreates = await this.agentRepository.find({
      where: createWhere,
      relations: ['user', 'parentAgent', 'parentAgent.user'],
      order: { createdAt: 'DESC' },
    });

    const pendingDeactivations = await this.agentRepository.find({
      where: deactivationWhere,
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    });

    return { pendingCreates, pendingDeactivations };
  }
}
