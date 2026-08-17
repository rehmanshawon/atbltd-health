import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CommissionService } from '../commission/commission.service';
import { SmsService } from '../sms/sms.service';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly commissionService: CommissionService,
    private readonly smsService: SmsService,
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
    // Member stats
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

    // Payment stats
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

    // Claim stats
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

    // Agent stats
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
   * Get all payments (with filters)
   */
  async getPayments(
    status?: PaymentStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const where: any = {};
    if (status) where.status = status;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Verify a payment (Maker role in Maker-Checker)
   */
  async verifyPayment(
    paymentId: string,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${payment.status}`);
    }

    // Update payment
    payment.status = PaymentStatus.VERIFIED;
    payment.verifiedBy = adminUserId;
    payment.verifiedAt = new Date();
    await this.paymentRepository.save(payment);

    // Activate membership
    const membership = await this.membershipRepository.findOne({
      where: { userId: payment.userId },
    });

    if (membership) {
      const today = new Date();
      membership.isPaymentVerified = true;
      membership.isActive = true;
      membership.membershipStartDate = today;

      const endDate = new Date(today);
      endDate.setFullYear(endDate.getFullYear() + 1);
      membership.membershipEndDate = endDate;

      await this.membershipRepository.save(membership);
    }

    // Activate user
    if (payment.user) {
      payment.user.isActive = true;
      await this.userRepository.save(payment.user);
    }

    // Send SMS with credentials
    try {
      await this.smsService.sendMembershipActivationSms(
        payment.user.mobileNumber,
        {
          fullName: payment.user.fullName,
          memberId: payment.user.memberId,
          temporaryPassword: 'ATB@Welcome', // TODO: Generate random per user
        },
      );
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }

    // Create commission for referring agent
    if (payment.user?.referralId) {
      try {
        await this.commissionService.createRegistrationCommission(
          payment.userId,
          Number(payment.amount),
        );
      } catch (error) {
        // Don't fail payment verification if commission fails
        console.error('Failed to create commission:', error);
      }
    }

    // Audit log
    await this.auditLogRepository.save({
      action: 'PAYMENT_VERIFIED',
      entity: 'Payment',
      entityId: paymentId,
      performedById: adminUserId,
      newValue: {
        status: 'verified',
        amount: Number(payment.amount),
        memberId: payment.user?.memberId,
      },
    });

    return {
      success: true,
      message: 'Payment verified and membership activated',
    };
  }

  /**
   * Get recent audit logs
   */
  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
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
   * Get pending payments that need verification
   */
  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { status: PaymentStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }
}
