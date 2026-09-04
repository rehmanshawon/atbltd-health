import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentVerificationService } from './payment-verification.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly paymentVerificationService: PaymentVerificationService,
  ) {}

  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats(): Promise<{
    members: {
      total: number;
      active: number;
      inactive: number;
      newThisMonth: number;
    };
    payments: {
      totalCollection: number;
      pendingVerification: number;
      verifiedToday: number;
    };
    claims: {
      submitted: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    agents: { total: number; active: number };
  }> {
    const totalMembers = await this.userRepository.count({
      where: { role: UserRole.MEMBER },
    });
    const activeMembers = await this.userRepository.count({
      where: { role: UserRole.MEMBER, isActive: true },
    });

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.userRepository.count({
      where: {
        role: UserRole.MEMBER,
        createdAt: firstDayOfMonth,
      },
    });

    const totalCollection = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.VERIFIED })
      .andWhere('payment.paymentType = :type', { type: 'membership_fee' })
      .getRawOne();

    const pendingVerification = await this.paymentRepository.count({
      where: { status: PaymentStatus.PENDING },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const verifiedToday = await this.paymentRepository.count({
      where: {
        status: PaymentStatus.VERIFIED,
        verifiedAt: today,
      },
    });

    const submittedClaims = await this.claimRepository.count();
    const pendingClaims = await this.claimRepository.count({
      where: { status: ClaimStatus.SUBMITTED },
    });
    const approvedClaims = await this.claimRepository.count({
      where: { status: ClaimStatus.APPROVED },
    });
    const rejectedClaims = await this.claimRepository.count({
      where: { status: ClaimStatus.REJECTED },
    });

    const totalAgents = await this.agentRepository.count();
    const activeAgents = await this.agentRepository.count({
      where: { isActive: true },
    });

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        inactive: totalMembers - activeMembers,
        newThisMonth,
      },
      payments: {
        totalCollection: Number(totalCollection?.total) || 0,
        pendingVerification,
        verifiedToday,
      },
      claims: {
        submitted: submittedClaims,
        pending: pendingClaims,
        approved: approvedClaims,
        rejected: rejectedClaims,
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
      },
    };
  }

  /**
   * Delegated: Get all payments (with filters)
   */
  async getPayments(status?: PaymentStatus, page = 1, limit = 20) {
    return this.paymentVerificationService.getPayments(status, page, limit);
  }

  /**
   * Delegated: Verify a payment
   */
  async verifyPayment(paymentId: string, adminUserId: string, adminRole: string) {
    return this.paymentVerificationService.verifyPayment(paymentId, adminUserId, adminRole);
  }

  /**
   * Delegated: Get pending payments
   */
  async getPendingPayments(userRole?: string) {
    return this.paymentVerificationService.getPendingPayments(userRole);
  }

  /**
   * Get recent audit logs
   */
  async getAuditLogs(
    page = 1,
    limit = 50,
  ): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const [logs, total] = await this.auditLogRepository.findAndCount({
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get dashboard stats for Owner/Agent
   */
  async getAgentDashboardStats(userId: string): Promise<any> {
    const agent = await this.agentRepository.findOne({
      where: { userId, isActive: true },
    });

    if (!agent) {
      return {
        members: { total: 0, active: 0 },
        commissions: { totalEarned: 0, totalPaid: 0 },
      };
    }

    const totalMembers = await this.userRepository.count({
      where: { referralId: agent.agentCode, role: UserRole.MEMBER },
    });

    const activeMembers = await this.userRepository.count({
      where: {
        referralId: agent.agentCode,
        role: UserRole.MEMBER,
        isActive: true,
      },
    });

    const subAgents = await this.agentRepository.count({
      where: { parentAgentId: agent.id },
    });

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
      },
      commissions: {
        totalEarned: Number(agent.totalCommissionEarned),
        totalPaid: Number(agent.totalCommissionPaid),
      },
      agents: {
        total: subAgents,
      },
    };
  }
}
