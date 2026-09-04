import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CommissionService } from '../commission/commission.service';
import { SmsService } from '../sms/sms.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';

@Injectable()
export class PaymentVerificationService {
  private readonly logger = new Logger(PaymentVerificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly commissionService: CommissionService,
    private readonly smsService: SmsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Get all payments (with filters & pagination)
   */
  async getPayments(
    status?: PaymentStatus,
    page = 1,
    limit = 20,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const where: FindOptionsWhere<Payment> = {};
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
   * Get pending payments based on reviewer role
   */
  async getPendingPayments(userRole?: string): Promise<Payment[]> {
    if (userRole === UserRole.SUPER_ADMIN) {
      return this.paymentRepository.find({
        where: {
          status: PaymentStatus.PENDING,
          notes: 'Reviewed by Admin. Awaiting Super Admin authorization.',
        },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
    }

    return this.paymentRepository.find({
      where: { status: PaymentStatus.PENDING, notes: null },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Verify a payment (Maker-Checker workflow)
   */
  async verifyPayment(
    paymentId: string,
    adminUserId: string,
    adminRole: string,
  ): Promise<{
    success: boolean;
    message: string;
    requiresFinalApproval?: boolean;
  }> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      if (payment.status === PaymentStatus.VERIFIED && adminRole === UserRole.SUPER_ADMIN) {
        return { success: true, message: 'Payment was already authorized' };
      }
      throw new BadRequestException(`Payment is already ${payment.status}`);
    }

    if (adminRole === UserRole.SUPER_ADMIN) {
      const authorization = await this.paymentRepository.update(
        { id: paymentId, status: PaymentStatus.PENDING },
        {
          status: PaymentStatus.VERIFIED,
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
        },
      );

      if (!authorization.affected) {
        const currentPayment = await this.paymentRepository.findOne({ where: { id: paymentId } });
        if (currentPayment?.status === PaymentStatus.VERIFIED) {
          return { success: true, message: 'Payment was already authorized' };
        }
        throw new BadRequestException('Payment authorization could not be completed');
      }

      payment.status = PaymentStatus.VERIFIED;
      payment.verifiedBy = adminUserId;
      payment.verifiedAt = new Date();

      await this.activateMembership(payment, adminUserId);

      return {
        success: true,
        message: 'Payment authorized and membership activated',
      };
    }

    payment.verifiedBy = adminUserId;
    payment.verifiedAt = new Date();
    payment.notes = 'Reviewed by Admin. Awaiting Super Admin authorization.';
    await this.paymentRepository.save(payment);

    await this.notificationService.notifyRoles(
      [UserRole.SUPER_ADMIN],
      NotificationType.PAYMENT_VERIFIED,
      'Payment Awaiting Authorization',
      `${payment.user.fullName} (${payment.user.memberId}) - ${payment.amount} BDT reviewed by Admin. Needs SA authorization.`,
      '/admin',
    );

    return {
      success: true,
      message: 'Payment reviewed. Awaiting Super Admin authorization.',
      requiresFinalApproval: true,
    };
  }

  /**
   * Activate membership and user, send notifications and SMS, record audit log
   */
  async activateMembership(payment: Payment, adminUserId: string): Promise<void> {
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

    if (payment.user) {
      payment.user.isActive = true;
      await this.userRepository.save(payment.user);
    }

    await this.notificationService.notifyUser(
      payment.userId,
      NotificationType.PAYMENT_VERIFIED,
      'Membership Activated',
      `Your membership has been activated. Your Member ID is ${payment.user.memberId}.`,
      '/dashboard',
    );

    await this.notificationService.notifyRoles(
      [UserRole.ADMIN, UserRole.OWNER],
      NotificationType.PAYMENT_VERIFIED,
      'Payment Authorized',
      `Payment of ${payment.amount} BDT from ${payment.user.fullName} authorized by SA.`,
      '/admin',
    );

    if (payment.user?.mobileNumber) {
      try {
        await this.smsService.sendMembershipActivationSms(payment.user.mobileNumber, {
          fullName: payment.user.fullName,
          memberId: payment.user.memberId,
        });
      } catch (error) {
        this.logger.error('Failed to send SMS:', error instanceof Error ? error.message : error);
      }
    }

    if (payment.user?.referralId) {
      try {
        await this.commissionService.createRegistrationCommission(
          payment.userId,
          Number(payment.amount),
        );
      } catch (error) {
        this.logger.error(
          'Failed to create commission:',
          error instanceof Error ? error.message : error,
        );
      }
    }

    await this.auditLogRepository.save({
      action: 'PAYMENT_VERIFIED',
      entity: 'Payment',
      entityId: payment.id,
      performedById: adminUserId,
      newValue: {
        status: 'verified',
        amount: Number(payment.amount),
        memberId: payment.user?.memberId,
      },
    });
  }
}
