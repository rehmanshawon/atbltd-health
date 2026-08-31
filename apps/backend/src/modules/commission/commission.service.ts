import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Commission, CommissionStatus, CommissionType } from '../../entities/commission.entity';
import { Agent } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(Commission)
    private readonly commissionRepository: Repository<Commission>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Calculate and create commission when a member's payment is verified
   * Called from AdminService.verifyPayment()
   */
  async createRegistrationCommission(
    memberId: string,
    registrationAmount: number,
  ): Promise<Commission | null> {
    const member = await this.userRepository.findOne({
      where: { id: memberId },
    });

    if (!member || !member.referralId) {
      return null; // No referral, no commission
    }

    // Find the referring agent
    const agent = await this.agentRepository.findOne({
      where: { agentCode: member.referralId, isActive: true },
    });

    if (!agent) {
      return null; // Agent not found or inactive
    }

    // Check if commission already exists for this member
    const existing = await this.commissionRepository.findOne({
      where: { memberId, commissionType: CommissionType.MEMBER_REGISTRATION },
    });

    if (existing) {
      return existing;
    }

    // Calculate commission amount
    const commissionAmount = (registrationAmount * Number(agent.commissionRate)) / 100;

    const commission = this.commissionRepository.create({
      agentId: agent.id,
      agentCode: agent.agentCode,
      memberId,
      memberCode: member.memberId,
      commissionType: CommissionType.MEMBER_REGISTRATION,
      registrationAmount,
      commissionRate: Number(agent.commissionRate),
      commissionAmount,
      status: CommissionStatus.PENDING,
    });

    const saved = await this.commissionRepository.save(commission);

    // Update agent's total earned
    agent.totalCommissionEarned = Number(agent.totalCommissionEarned) + commissionAmount;
    await this.agentRepository.save(agent);

    // If agent has a parent (Owner), create override commission
    if (agent.parentAgentId) {
      const parentAgent = await this.agentRepository.findOne({
        where: { id: agent.parentAgentId, isActive: true },
      });

      if (parentAgent) {
        const overrideRate = Number(parentAgent.commissionRate) - Number(agent.commissionRate);
        if (overrideRate > 0) {
          const overrideAmount = (registrationAmount * overrideRate) / 100;

          const overrideCommission = this.commissionRepository.create({
            agentId: parentAgent.id,
            agentCode: parentAgent.agentCode,
            memberId,
            memberCode: member.memberId,
            commissionType: CommissionType.OVERRIDE,
            registrationAmount,
            commissionRate: overrideRate,
            commissionAmount: overrideAmount,
            status: CommissionStatus.PENDING,
          });

          await this.commissionRepository.save(overrideCommission);

          parentAgent.totalCommissionEarned =
            Number(parentAgent.totalCommissionEarned) + overrideAmount;
          await this.agentRepository.save(parentAgent);
        }
      }
    }

    await this.auditLogRepository.save({
      action: 'COMMISSION_CREATED',
      entity: 'Commission',
      entityId: saved.id,
      newValue: {
        agentCode: agent.agentCode,
        memberCode: member.memberId,
        amount: commissionAmount,
        rate: Number(agent.commissionRate),
      },
    });

    return saved;
  }

  /**
   * Approve a commission (Maker role)
   */
  async approveCommission(
    commissionId: string,
    adminId: string,
    adminRole: string,
  ): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId },
    });

    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status !== CommissionStatus.PENDING) {
      throw new BadRequestException(`Commission is already ${commission.status}`);
    }

    if (adminRole === UserRole.SUPER_ADMIN) {
      // SA directly approves
      commission.status = CommissionStatus.APPROVED;
      commission.approvedBy = adminId;
      commission.approvedAt = new Date();
    } else {
      // Admin (Maker) — marks as reviewed
      commission.approvedBy = adminId;
      commission.approvedAt = new Date();
      commission.notes = 'Reviewed by Admin. Awaiting SA confirmation.';
    }

    return this.commissionRepository.save(commission);
  }

  async declineCommission(
    commissionId: string,
    adminId: string,
    adminRole: string,
    reason?: string,
  ): Promise<Commission> {
    if (adminRole !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only Super Admin can decline commissions');
    }

    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId },
    });

    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status !== CommissionStatus.PENDING) {
      throw new BadRequestException('Only pending commissions can be declined');
    }

    commission.status = CommissionStatus.DECLINED;
    commission.notes = reason || 'Declined by Super Admin';
    const saved = await this.commissionRepository.save(commission);

    await this.auditLogRepository.save({
      action: 'COMMISSION_DECLINED',
      entity: 'Commission',
      entityId: commissionId,
      performedById: adminId,
      newValue: { status: CommissionStatus.DECLINED, reason: reason || null },
    });

    return saved;
  }

  /**
   * Confirm commission payment (Checker role — dual control)
   */
  async confirmCommissionPayment(commissionId: string, adminId: string): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId },
    });

    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status !== CommissionStatus.APPROVED) {
      throw new BadRequestException('Commission must be approved first');
    }
    if (commission.approvedBy === adminId) {
      throw new BadRequestException(
        'Maker and Checker must be different admins for payment confirmation.',
      );
    }

    commission.status = CommissionStatus.PAID;
    commission.checkerApprovedBy = adminId;
    commission.paidAt = new Date();

    const saved = await this.commissionRepository.save(commission);

    // Update agent's paid amount
    const agent = await this.agentRepository.findOne({
      where: { id: commission.agentId },
    });

    if (agent) {
      agent.totalCommissionPaid =
        Number(agent.totalCommissionPaid) + Number(commission.commissionAmount);
      await this.agentRepository.save(agent);
    }

    await this.auditLogRepository.save({
      action: 'COMMISSION_PAID',
      entity: 'Commission',
      entityId: commissionId,
      performedById: adminId,
      newValue: { status: 'paid', amount: Number(commission.commissionAmount) },
    });

    return saved;
  }

  /**
   * Reverse a commission (for refunds/fraud)
   */
  async reverseCommission(
    commissionId: string,
    adminId: string,
    reason: string,
  ): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId },
    });

    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status === CommissionStatus.REVERSED) {
      throw new BadRequestException('Commission is already reversed');
    }

    // Capture whether it was already paid before reversing
    const wasPaid = commission.status === CommissionStatus.PAID;

    commission.status = CommissionStatus.REVERSED;
    commission.reversedAt = new Date();
    commission.reversalReason = reason;

    const saved = await this.commissionRepository.save(commission);

    // Deduct from agent's earned
    const agent = await this.agentRepository.findOne({
      where: { id: commission.agentId },
    });

    if (agent) {
      agent.totalCommissionEarned =
        Number(agent.totalCommissionEarned) - Number(commission.commissionAmount);
      if (wasPaid) {
        agent.totalCommissionPaid =
          Number(agent.totalCommissionPaid) - Number(commission.commissionAmount);
      }
      await this.agentRepository.save(agent);
    }

    await this.auditLogRepository.save({
      action: 'COMMISSION_REVERSED',
      entity: 'Commission',
      entityId: commissionId,
      performedById: adminId,
      newValue: { status: 'reversed', reason },
    });

    return saved;
  }

  /**
   * Get all commissions with filters
   */
  /**
   * Get all commissions with filters
   * Admin sees: commissions not yet approved
   * SA sees: commissions approved by Admin, awaiting payout confirmation
   */
  async findAll(filters: {
    agentId?: string;
    status?: CommissionStatus;
    page?: number;
    limit?: number;
    reviewerRole?: string;
  }): Promise<{
    commissions: Commission[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { agentId, status, page = 1, limit = 20, reviewerRole } = filters;
    const where: any = {};

    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    if (reviewerRole === UserRole.ADMIN) {
      // Admin sees unapproved commissions
      where.approvedBy = null;
    } else if (reviewerRole === UserRole.SUPER_ADMIN) {
      // SA sees commissions approved by Admin, not yet paid
      where.approvedBy = Not(IsNull());
      where.checkerApprovedBy = null;
      where.status = CommissionStatus.APPROVED;
    }

    const [commissions, total] = await this.commissionRepository.findAndCount({
      where,
      relations: ['agent', 'member'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { commissions, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get agent's commission summary
   */
  async getAgentCommissionSummary(agentId: string): Promise<{
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
    totalReversed: number;
    recentCommissions: Commission[];
  }> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });

    if (!agent) throw new NotFoundException('Agent not found');

    const recentCommissions = await this.commissionRepository.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['member'],
    });

    return {
      totalEarned: Number(agent.totalCommissionEarned),
      totalPaid: Number(agent.totalCommissionPaid),
      totalPending: Number(agent.totalCommissionEarned) - Number(agent.totalCommissionPaid),
      totalReversed: 0, // Can be computed from DB if needed
      recentCommissions,
    };
  }
}
