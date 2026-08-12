import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Agent } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create a new Owner or Agent
   */
  async createAgent(
    data: {
      fullName: string;
      mobileNumber: string;
      email?: string;
      password: string;
      role: UserRole.OWNER | UserRole.AGENT;
      commissionRate: number;
      parentAgentId?: string; // Only for agents under an owner
    },
    createdBy: string,
  ): Promise<{ user: User; agent: Agent }> {
    // Validate
    if (data.role !== UserRole.OWNER && data.role !== UserRole.AGENT) {
      throw new BadRequestException('Role must be owner or agent');
    }

    // Agents must have a parent agent
    if (data.role === UserRole.AGENT && !data.parentAgentId) {
      throw new BadRequestException('Agent must be assigned to an Owner');
    }

    // Verify parent agent exists and is active
    if (data.parentAgentId) {
      const parent = await this.agentRepository.findOne({
        where: { id: data.parentAgentId, isActive: true },
        relations: ['user'],
      });
      if (!parent) {
        throw new NotFoundException('Parent agent not found or inactive');
      }
    }

    // Check duplicate mobile
    const existing = await this.userRepository.findOne({
      where: { mobileNumber: data.mobileNumber },
    });
    if (existing) {
      throw new ConflictException(
        'A user with this mobile number already exists',
      );
    }

    // Generate member ID for owner/agent
    const memberId = await this.generateAgentMemberId(data.role);

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = this.userRepository.create({
      memberId,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      isActive: true,
      isKycVerified: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate agent code
    const agentCount = await this.agentRepository.count();
    const agentCode = `AGT-${new Date().getFullYear()}-${String(
      agentCount + 1,
    ).padStart(6, '0')}`;

    // Create agent record
    const agent = this.agentRepository.create({
      userId: savedUser.id,
      agentCode,
      commissionRate: data.commissionRate,
      parentAgentId: data.parentAgentId || null,
      isActive: true,
    });

    const savedAgent = await this.agentRepository.save(agent);

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
      },
    });

    return { user: savedUser, agent: savedAgent };
  }

  /**
   * Get all agents with their hierarchy
   */
  async getAllAgents(): Promise<Agent[]> {
    return this.agentRepository.find({
      where: { isActive: true },
      relations: ['user', 'parentAgent', 'parentAgent.user', 'subAgents'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get agents by parent (for Owner to see their agents)
   */
  async getAgentsByParent(parentAgentId: string): Promise<Agent[]> {
    return this.agentRepository.find({
      where: { parentAgentId, isActive: true },
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
   * Deactivate an agent
   */
  async deactivateAgent(agentId: string, adminId: string): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });

    if (!agent) throw new NotFoundException('Agent not found');

    agent.isActive = false;
    agent.user.isActive = false;

    await this.agentRepository.save(agent);
    await this.userRepository.save(agent.user);

    await this.auditLogRepository.save({
      action: 'AGENT_DEACTIVATED',
      entity: 'Agent',
      entityId: agentId,
      performedById: adminId,
      newValue: { agentCode: agent.agentCode, status: 'deactivated' },
    });
  }

  private async generateAgentMemberId(role: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = role === 'owner' ? 'OWN' : 'AGT';
    const count = await this.userRepository.count({
      where: { role: role as UserRole },
    });
    return `${prefix}-${currentYear}-${String(count + 1).padStart(6, '0')}`;
  }
}
