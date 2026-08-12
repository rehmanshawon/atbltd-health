import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../../entities/membership.entity';
import { User } from '../../entities/user.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Get member's full dashboard data
   */
  async getMemberDashboard(userId: string): Promise<{
    profile: Partial<User>;
    membership: Partial<Membership> | null;
    recentPayments: Partial<Payment>[];
    digitalCard: {
      memberId: string;
      fullName: string;
      membershipType: string;
      validUntil: Date | null;
      remainingBenefit: number;
      isActive: boolean;
    };
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['membership'],
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    const membership = user.membership || null;

    // Get recent payments
    const recentPayments = await this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Calculate remaining benefit
    const remainingBenefit = membership?.remainingBenefit ?? 0;

    return {
      profile: {
        memberId: user.memberId,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        email: user.email,
        nid: user.nid,
        permanentAddress: user.permanentAddress,
        role: user.role,
        isActive: user.isActive,
        isKycVerified: user.isKycVerified,
        createdAt: user.createdAt,
      },
      membership: membership
        ? {
            membershipFee: membership.membershipFee,
            isPaymentVerified: membership.isPaymentVerified,
            paymentMethod: membership.paymentMethod,
            membershipStartDate: membership.membershipStartDate,
            membershipEndDate: membership.membershipEndDate,
            isActive: membership.isActive,
            remainingBenefit: membership.remainingBenefit,
            renewalCount: membership.renewalCount,
            renewalFee: membership.renewalFee,
          }
        : null,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        paymentType: p.paymentType,
        amount: p.amount,
        method: p.method,
        status: p.status,
        transactionId: p.transactionId,
        createdAt: p.createdAt,
      })),
      digitalCard: {
        memberId: user.memberId,
        fullName: user.fullName,
        membershipType: 'Annual Membership',
        validUntil: membership?.membershipEndDate || null,
        remainingBenefit,
        isActive: user.isActive && (membership?.isActive ?? false),
      },
    };
  }

  /**
   * Get membership status summary (lightweight, for quick checks)
   */
  async getMembershipStatus(userId: string): Promise<{
    memberId: string;
    isActive: boolean;
    membershipStartDate: Date | null;
    membershipEndDate: Date | null;
    remainingBenefit: number;
    totalBenefit: number;
    daysUntilActivation: number;
    benefitsAvailable: boolean;
  }> {
    const membership = await this.membershipRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!membership) {
      throw new NotFoundException('No membership found for this user');
    }

    const now = new Date();
    const startDate = membership.membershipStartDate
      ? new Date(membership.membershipStartDate)
      : null;

    // Benefits available after 1 month (per business rules)
    let daysUntilActivation = 0;
    let benefitsAvailable = false;

    if (startDate) {
      const activationDate = new Date(startDate);
      activationDate.setMonth(activationDate.getMonth() + 1);

      if (now >= activationDate) {
        benefitsAvailable = true;
      } else {
        daysUntilActivation = Math.ceil(
          (activationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
    }

    return {
      memberId: membership.user?.memberId || '',
      isActive: membership.isActive,
      membershipStartDate: membership.membershipStartDate,
      membershipEndDate: membership.membershipEndDate,
      remainingBenefit: Number(membership.remainingBenefit),
      totalBenefit: 12000,
      daysUntilActivation,
      benefitsAvailable,
    };
  }
}
