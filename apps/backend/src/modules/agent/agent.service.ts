import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Agent, AgentApprovalStatus } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
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

  /**
   * Generate password: first 3 letters of name (lowercase) + last 6 digits of mobile
   */
  private generatePassword(fullName: string, mobileNumber: string): string {
    const namePart = fullName.replace(/\s+/g, '').substring(0, 3).toLowerCase();
    const mobilePart = mobileNumber.replace(/\D/g, '').slice(-6);
    return `${namePart}${mobilePart}`;
  }

  /**
   * Create a new Owner or Agent
   */
  async createAgent(
    data: {
      fullName: string;
      mobileNumber: string;
      email?: string;
      // password: string;
      role: UserRole.OWNER | UserRole.AGENT;
      commissionRate: number;
      parentAgentCode?: string; // Agent code for the parent (e.g., ATB-26-OW-1)
    },
    createdBy: string,
  ): Promise<{ user: User; agent: Agent }> {
    // Validate
    if (data.role !== UserRole.OWNER && data.role !== UserRole.AGENT) {
      throw new BadRequestException('Role must be owner or agent');
    }

    // Agents must have a parent agent
    if (data.role === UserRole.AGENT && !data.parentAgentCode) {
      throw new BadRequestException('Agent must be assigned to an Owner');
    }

    // Find parent agent by agent code
    let parentAgentId: string | null = null;
    if (data.parentAgentCode) {
      const parent = await this.agentRepository.findOne({
        where: { agentCode: data.parentAgentCode, isActive: true },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent agent with code ${data.parentAgentCode} not found or inactive`,
        );
      }
      parentAgentId = parent.id; // Store the UUID, not the code
    }

    // Check duplicate mobile
    const existing = await this.userRepository.findOne({
      where: { mobileNumber: data.mobileNumber },
    });
    if (existing) {
      throw new ConflictException('A user with this mobile number already exists');
    }

    // Generate member ID for owner/agent
    const memberId = await this.generateAgentMemberId(data.role);

    // AUTO-GENERATE PASSWORD: first 3 letters of name + last 6 digits of mobile
    const autoPassword = this.generatePassword(data.fullName, data.mobileNumber);
    const hashedPassword = await bcrypt.hash(autoPassword, 12);

    // Find the creator
    const creator = await this.userRepository.findOne({
      where: { id: createdBy },
    });

    // Determine initial approval state based on creator's role
    let initialIsActive = false;
    let initialApprovalStatus = AgentApprovalStatus.PENDING;

    if (creator?.role === UserRole.SUPER_ADMIN) {
      // SA creates directly — no approval needed
      initialIsActive = true;
      initialApprovalStatus = AgentApprovalStatus.ACTIVE;
    } else if (creator?.role === UserRole.ADMIN) {
      // Admin creates — needs SA final approval
      initialIsActive = false;
      initialApprovalStatus = AgentApprovalStatus.APPROVED_BY_ADMIN;
    } else if (creator?.role === UserRole.OWNER) {
      // Owner creates agent — needs Admin check + SA final
      initialIsActive = false;
      initialApprovalStatus = AgentApprovalStatus.PENDING;
    }

    // Create user
    const user = this.userRepository.create({
      memberId,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      isActive: initialIsActive,
      isKycVerified: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Use memberId as agent code
    const agentCode = memberId;

    // Create agent record with plain password for SMS later
    const agent = this.agentRepository.create({
      userId: savedUser.id,
      agentCode,
      commissionRate: data.commissionRate,
      parentAgentId: parentAgentId,
      isActive: initialIsActive,
      approvalStatus: initialApprovalStatus,
      createdBy: creator?.memberId || createdBy,
      createdByName: creator?.fullName || 'Unknown',
      createdByRole: creator?.role || 'unknown',
      plainPassword: autoPassword, // Store for SMS on approval
    });

    const savedAgent = await this.agentRepository.save(agent);

    if (creator?.role === UserRole.ADMIN) {
      // Admin created something — notify SA
      await this.notificationService.notifyRoles(
        [UserRole.SUPER_ADMIN],
        NotificationType.SYSTEM_ALERT,
        `${data.role === 'owner' ? 'Owner' : 'Agent'} Awaiting Approval`,
        `${creator.fullName} created ${data.role} ${savedUser.fullName} (${savedUser.memberId}). Your approval is required.`,
        '/admin/approvals',
        savedAgent.id,
      );
    }

    if (creator?.role === UserRole.OWNER) {
      // Owner created agent — notify Admin and SA
      await this.notificationService.notifyRoles(
        [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        NotificationType.SYSTEM_ALERT,
        'Agent Awaiting Approval',
        `${creator.fullName} (${creator.memberId}) created agent ${savedUser.fullName} (${savedUser.memberId}). Pending approval.`,
        '/admin/approvals',
        savedAgent.id,
      );
    }

    // If SA created directly, send SMS immediately (no approval needed)
    if (
      creator?.role === UserRole.SUPER_ADMIN &&
      initialApprovalStatus === AgentApprovalStatus.ACTIVE
    ) {
      const userRole = savedUser.role;

      if (userRole === UserRole.OWNER) {
        await this.smsService.sendSms(
          savedUser.mobileNumber,
          `ধন্যবাদ। ATB Ltd এ OWNER ID হোল্ডার হিসেবে আপনাকে স্বাগতম। আপনার OWNER ID: ${savedAgent.agentCode}, আপনার পাসওয়ার্ড: ${autoPassword}`,
        );
      } else if (userRole === UserRole.AGENT) {
        await this.smsService.sendSms(
          savedUser.mobileNumber,
          `ধন্যবাদ। ATB Ltd এ AGENT হিসেবে আপনাকে স্বাগতম। আপনার AGENT ID: ${savedAgent.agentCode}, আপনার পাসওয়ার্ড: ${autoPassword}`,
        );
      }

      // Clear plain password (already sent)
      savedAgent.plainPassword = null;
      await this.agentRepository.save(savedAgent);
    }

    // Also notify the user
    await this.notificationService.notifyUser(
      savedUser.id,
      NotificationType.SYSTEM_ALERT,
      savedUser.role === UserRole.OWNER ? 'Owner ID Activated' : 'Agent ID Activated',
      `Your ${savedUser.role === UserRole.OWNER ? 'OWNER' : 'AGENT'} ID ${
        savedAgent.agentCode
      } has been activated.`,
      '/admin',
    );

    // Audit log
    await this.auditLogRepository.save({
      action: `${data.role.toUpperCase()}_CREATED`,
      entity: 'User',
      entityId: savedUser.id,
      performedById: createdBy,
      newValue: {
        memberId: savedUser.memberId,
        fullName: savedUser.fullName,
        role: savedUser.role,
        agentCode: savedAgent.agentCode,
        commissionRate: data.commissionRate,
        parentAgentCode: data.parentAgentCode || null,
        approvalStatus: initialApprovalStatus,
        createdByRole: creator?.role || 'unknown',
      },
    });

    return { user: savedUser, agent: savedAgent };
  }

  /**
   * Get all agents with their hierarchy
   */
  async getAllAgents(): Promise<Agent[]> {
    return this.agentRepository.find({
      relations: ['user', 'parentAgent', 'parentAgent.user', 'subAgents'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get agents by parent (for Owner to see their agents)
   */
  async getAgentsByParent(parentAgentId: string): Promise<Agent[]> {
    return this.agentRepository.find({
      where: { parentAgentId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get agent by user ID
   */
  async getAgentByUserId(userId: string): Promise<Agent | null> {
    return this.agentRepository.findOne({
      where: { userId },
      relations: ['user', 'parentAgent', 'subAgents'],
    });
  }

  /**
   * Get all agents only (no owners)
   */
  async getAgentsOnly(): Promise<Agent[]> {
    const agents = await this.agentRepository.find({
      relations: ['user', 'parentAgent', 'parentAgent.user'],
      order: { createdAt: 'DESC' },
    });

    const agentsOnly = agents.filter((a) => a.user?.role === UserRole.AGENT);

    // Load members for each agent
    for (const agent of agentsOnly) {
      const members = await this.userRepository.find({
        where: { referralId: agent.agentCode, role: UserRole.MEMBER },
        select: ['id', 'memberId', 'fullName', 'mobileNumber', 'isActive', 'createdAt'],
        order: { createdAt: 'DESC' },
      });
      (agent as any).members = members;
    }

    return agentsOnly;
  }

  private async generateAgentMemberId(role: string): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2);

    let prefix = '';
    switch (role) {
      case 'admin':
        prefix = 'AD';
        break;
      case 'owner':
        prefix = 'OW';
        break;
      case 'agent':
        prefix = 'AG';
        break;
      default:
        prefix = 'AD';
    }

    const count = await this.userRepository.count({
      where: { role: role as UserRole },
    });
    return `ATB-${currentYear}-${prefix}-${count + 1}`;
  }
}
