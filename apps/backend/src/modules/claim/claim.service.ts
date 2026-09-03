import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Claim } from '../../entities/claim.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment, PaymentStatus, PaymentType } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { SmsService } from '../sms/sms.service';
import { User } from '../../entities/user.entity';
@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(ClaimDocument)
    private readonly claimDocumentRepository: Repository<ClaimDocument>,
    private readonly notificationService: NotificationService,
    private readonly smsService: SmsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Member submits a new claim
   */
  async submitClaim(
    userId: string,
    data: {
      surgeryType: string;
      hospitalName: string;
      admissionDate: string;
      operationDate?: string;
      doctorName?: string;
      claimedAmount: number;
      notes?: string;
    },
  ): Promise<Claim> {
    const membership = await this.membershipRepository.findOne({
      where: { userId, isActive: true },
    });

    if (!membership) {
      throw new BadRequestException('No active membership found.');
    }

    if (membership.membershipStartDate) {
      const activationDate = new Date(membership.membershipStartDate);
      activationDate.setMonth(activationDate.getMonth() + 1);
      if (new Date() < activationDate) {
        throw new BadRequestException(
          'Benefits not yet available. 1-month waiting period applies.',
        );
      }
    }

    if (membership.remainingBenefit <= 0) {
      throw new BadRequestException('Annual benefit limit exhausted.');
    }

    if (data.claimedAmount > Number(membership.remainingBenefit)) {
      throw new BadRequestException(
        `Amount exceeds remaining benefit of ${membership.remainingBenefit} BDT`,
      );
    }

    const claim = this.claimRepository.create({
      memberId: userId,
      surgeryType: data.surgeryType,
      hospitalName: data.hospitalName,
      admissionDate: new Date(data.admissionDate),
      operationDate: data.operationDate ? new Date(data.operationDate) : null,
      doctorName: data.doctorName,
      claimedAmount: data.claimedAmount,
      notes: data.notes,
      status: ClaimStatus.SUBMITTED,
    });

    const savedClaim = await this.claimRepository.save(claim);

    // Notify admins
    await this.notificationService.notifyRoles(
      [UserRole.ADMIN, UserRole.OWNER],
      NotificationType.CLAIM_SUBMITTED,
      'New ATB Benefit Application',
      `${savedClaim.surgeryType} - ${savedClaim.hospitalName} by ${savedClaim.memberId}`,
      '/admin/claims',
      savedClaim.id,
    );

    await this.auditLogRepository.save({
      action: 'CLAIM_SUBMITTED',
      entity: 'Claim',
      entityId: savedClaim.id,
      performedById: userId,
      newValue: {
        surgeryType: data.surgeryType,
        hospitalName: data.hospitalName,
        claimedAmount: data.claimedAmount,
      },
    });

    return savedClaim;
  }

  /**
   * Get member's own claims
   */
  async getMemberClaims(userId: string): Promise<Claim[]> {
    return this.claimRepository.find({
      where: { memberId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get single claim (member's own or admin)
   */
  async getClaimById(claimId: string, userId: string, userRole: string): Promise<Claim> {
    const where: any = { id: claimId };

    // Members can only see their own claims
    if (userRole === UserRole.MEMBER) {
      where.memberId = userId;
    }

    const claim = await this.claimRepository.findOne({
      where,
      relations: ['member'],
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return claim;
  }

  /**
   * Admin: Get all claims with optional filters
   */
  /**
   * Get all claims with optional filters
   * Admin sees: claims not yet reviewed
   * SA sees: claims reviewed by Admin, awaiting final approval
   */
  async getAllClaims(filters: {
    status?: ClaimStatus;
    memberId?: string;
    page?: number;
    limit?: number;
    reviewerRole?: string;
  }): Promise<{
    claims: Claim[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, memberId, page = 1, limit = 20, reviewerRole } = filters;
    const where: any = {};

    if (status) where.status = status;
    if (memberId) where.memberId = memberId;

    if (reviewerRole === UserRole.ADMIN) {
      // Admin sees unreviewed claims
      where.reviewedBy = null;
    } else if (reviewerRole === UserRole.SUPER_ADMIN) {
      // SA sees claims reviewed by Admin but not finally approved
      where.reviewedBy = Not(IsNull());
      where.checkerApprovedBy = null;
    }

    const [claims, total] = await this.claimRepository.findAndCount({
      where,
      relations: ['member'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { claims, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Admin: Update claim status through workflow
   * Implements Maker-Checker for APPROVED status
   */
  async updateClaimStatus(
    claimId: string,
    newStatus: ClaimStatus,
    adminId: string,
    adminRole: string,
    data?: {
      rejectionReason?: string;
      approvedAmount?: number;
      notes?: string;
    },
  ): Promise<Claim> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    const previousStatus = claim.status;

    // Validate status transition
    this.validateStatusTransition(claim.status, newStatus);

    // Maker-Checker: APPROVED requires two admins
    if (newStatus === ClaimStatus.APPROVED) {
      if (adminRole === UserRole.SUPER_ADMIN) {
        // SA directly approves (Checker + Maker combined for SA)
        claim.status = ClaimStatus.APPROVED;
        claim.approvedBy = adminId;
        claim.checkerApprovedBy = adminId;
        claim.reviewedBy = adminId;
        claim.reviewedAt = new Date();
        claim.approvedAmount = data?.approvedAmount || claim.claimedAmount;
        if (data?.notes) claim.notes = data?.notes;
      } else if (adminRole === UserRole.ADMIN) {
        // Admin is Maker — first approval
        if (claim.reviewedBy === adminId) {
          throw new BadRequestException(
            'You have already reviewed this application. Awaiting Super Admin final approval.',
          );
        }
        claim.reviewedBy = adminId;
        claim.reviewedAt = new Date();
        claim.approvedBy = adminId; // Maker
        claim.status = ClaimStatus.UNDER_REVIEW; // Still needs SA
        claim.approvedAmount = data?.approvedAmount || claim.claimedAmount;
        if (data?.notes) claim.notes = data?.notes;
      } else {
        throw new BadRequestException('Only Admin or Super Admin can approve');
      }
    } else if (newStatus === ClaimStatus.REJECTED) {
      claim.status = ClaimStatus.REJECTED;
      claim.rejectionReason = data?.rejectionReason;
      claim.reviewedBy = adminId;
      claim.reviewedAt = new Date();
    } else if (newStatus === ClaimStatus.DOCUMENT_REQUIRED) {
      claim.status = ClaimStatus.DOCUMENT_REQUIRED;
      claim.reviewedBy = adminId;
      claim.reviewedAt = new Date();
    } else if (newStatus === ClaimStatus.UNDER_REVIEW) {
      claim.status = ClaimStatus.UNDER_REVIEW;
      claim.reviewedBy = adminId;
    } else if (newStatus === ClaimStatus.HOSPITAL_VERIFICATION) {
      claim.status = ClaimStatus.HOSPITAL_VERIFICATION;
    } else if (newStatus === ClaimStatus.PAYMENT_PROCESSED) {
      if (claim.status !== ClaimStatus.APPROVED) {
        throw new BadRequestException('Only approved claims can be marked as paid');
      }

      // Create payment record for the disbursement
      await this.paymentRepository.save({
        userId: claim.memberId,
        paymentType: PaymentType.CLAIM_DISBURSEMENT,
        amount: claim.approvedAmount || claim.claimedAmount,
        method: 'bkash',
        transactionId: `CLM-${claimId.substring(0, 8)}`,
        recipientAccount: 'member',
        status: PaymentStatus.VERIFIED,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      });

      // Deduct from remaining benefit
      const membership = await this.membershipRepository.findOne({
        where: { userId: claim.memberId },
      });

      if (membership) {
        membership.remainingBenefit =
          Number(membership.remainingBenefit) - (claim.approvedAmount || claim.claimedAmount);
        await this.membershipRepository.save(membership);
      }

      claim.status = ClaimStatus.PAYMENT_PROCESSED;
      claim.isDisbursed = true;
      claim.disbursedAt = new Date();
    }

    const updatedClaim = await this.claimRepository.save(claim);

    // After saving updatedClaim, if Admin did first approval:
    if (newStatus === ClaimStatus.APPROVED && adminRole === UserRole.ADMIN) {
      await this.notificationService.notifyRoles(
        [UserRole.SUPER_ADMIN],
        NotificationType.CLAIM_STATUS_UPDATED,
        'Application Awaiting Final Approval',
        `Application ${claimId.substring(0, 8)} reviewed by Admin. Needs SA approval.`,
        '/admin/claims',
        claimId,
      );
    }

    // Notify member
    await this.notificationService.notifyUser(
      claim.memberId,
      NotificationType.CLAIM_STATUS_UPDATED,
      `ATB Benefit ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
      `Your application status changed to ${newStatus.replace(/_/g, ' ')}`,
      '/dashboard/claims',
      claimId,
    );

    // SMS to member
    const claimWithMember = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['member'],
    });

    if (claimWithMember?.member?.mobileNumber) {
      await this.smsService.sendClaimStatusSms(
        claimWithMember.member.mobileNumber,
        claimId,
        newStatus,
      );
    }

    await this.auditLogRepository.save({
      action: `CLAIM_${newStatus.toUpperCase()}`,
      entity: 'Claim',
      entityId: claimId,
      performedById: adminId,
      newValue: { status: newStatus, ...data },
      oldValue: { status: previousStatus },
    });

    return updatedClaim;
  }

  /**
   * Get claim statistics for dashboard
   */
  async getClaimStats(): Promise<{
    total: number;
    byStatus: Record<ClaimStatus, number>;
    totalDisbursed: number;
  }> {
    const claims = await this.claimRepository.find();
    const byStatus: Record<string, number> = {};

    for (const status of Object.values(ClaimStatus)) {
      byStatus[status] = claims.filter((c) => c.status === status).length;
    }

    const totalDisbursed = claims
      .filter((c) => c.isDisbursed)
      .reduce((sum, c) => sum + Number(c.approvedAmount || c.claimedAmount), 0);

    return {
      total: claims.length,
      byStatus: byStatus as Record<ClaimStatus, number>,
      totalDisbursed,
    };
  }

  /**
   * Validate allowed status transitions
   */
  private validateStatusTransition(current: ClaimStatus, next: ClaimStatus): void {
    const allowedTransitions: Record<ClaimStatus, ClaimStatus[]> = {
      [ClaimStatus.SUBMITTED]: [ClaimStatus.UNDER_REVIEW, ClaimStatus.REJECTED],
      [ClaimStatus.UNDER_REVIEW]: [
        ClaimStatus.DOCUMENT_REQUIRED,
        ClaimStatus.HOSPITAL_VERIFICATION,
        ClaimStatus.REJECTED,
        ClaimStatus.APPROVED,
      ],
      [ClaimStatus.DOCUMENT_REQUIRED]: [
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.HOSPITAL_VERIFICATION,
      ],
      [ClaimStatus.HOSPITAL_VERIFICATION]: [
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.APPROVED,
        ClaimStatus.REJECTED,
      ],
      [ClaimStatus.APPROVED]: [ClaimStatus.PAYMENT_PROCESSED],
      [ClaimStatus.REJECTED]: [],
      [ClaimStatus.PAYMENT_PROCESSED]: [],
    };

    const allowed = allowedTransitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}. Allowed: ${allowed?.join(', ') || 'none'}`,
      );
    }
  }
}
