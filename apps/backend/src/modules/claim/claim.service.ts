import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from '../../entities/claim.entity';
import { Membership } from '../../entities/membership.entity';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../../entities/payment.entity';
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
   * Member uploads documents for an existing claim
   */
  async uploadDocuments(
    claimId: string,
    userId: string,
    fileUrls: string[],
  ): Promise<Claim> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId, memberId: userId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (
      claim.status === ClaimStatus.APPROVED ||
      claim.status === ClaimStatus.REJECTED ||
      claim.status === ClaimStatus.PAYMENT_PROCESSED
    ) {
      throw new BadRequestException(
        'Cannot upload documents to a finalized claim',
      );
    }

    claim.documents = [...(claim.documents || []), ...fileUrls];
    const updatedClaim = await this.claimRepository.save(claim);

    await this.auditLogRepository.save({
      action: 'CLAIM_DOCUMENTS_UPLOADED',
      entity: 'Claim',
      entityId: claimId,
      performedById: userId,
      newValue: { documents: fileUrls },
    });

    return updatedClaim;
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
  async getClaimById(
    claimId: string,
    userId: string,
    userRole: string,
  ): Promise<Claim> {
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
  async getAllClaims(filters: {
    status?: ClaimStatus;
    memberId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    claims: Claim[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, memberId, page = 1, limit = 20 } = filters;
    const where: any = {};

    if (status) where.status = status;
    if (memberId) where.memberId = memberId;

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

    // Validate status transition
    this.validateStatusTransition(claim.status, newStatus);

    // Maker-Checker: APPROVED requires two admins
    if (newStatus === ClaimStatus.APPROVED) {
      if (!claim.reviewedBy) {
        // First admin (Maker) sets to APPROVED but requires checker
        claim.reviewedBy = adminId;
        claim.reviewedAt = new Date();
        claim.approvedBy = adminId;
        claim.status = ClaimStatus.APPROVED;
        claim.approvedAmount = data?.approvedAmount || claim.claimedAmount;

        if (data?.notes) claim.notes = data?.notes;
      } else if (claim.reviewedBy !== adminId) {
        // Second admin (Checker) confirms
        claim.checkerApprovedBy = adminId;
        claim.status = ClaimStatus.APPROVED;
        // Status stays APPROVED, now fully approved by both
      } else {
        throw new BadRequestException(
          'This claim has already been approved by you. A different admin must confirm this approval (Maker-Checker policy).',
        );
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
        throw new BadRequestException(
          'Only approved claims can be marked as paid',
        );
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
          Number(membership.remainingBenefit) -
          (claim.approvedAmount || claim.claimedAmount);
        await this.membershipRepository.save(membership);
      }

      claim.status = ClaimStatus.PAYMENT_PROCESSED;
      claim.isDisbursed = true;
      claim.disbursedAt = new Date();
    }

    const updatedClaim = await this.claimRepository.save(claim);

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
      oldValue: { status: claim.status },
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
   * Member uploads documents with types
   */
  async uploadDocumentsWithTypes(
    claimId: string,
    userId: string,
    documents: Array<{
      documentType: string;
      fileName: string;
      fileUrl: string;
      notes?: string;
    }>,
  ): Promise<Claim> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId, memberId: userId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (
      claim.status === ClaimStatus.APPROVED ||
      claim.status === ClaimStatus.REJECTED ||
      claim.status === ClaimStatus.PAYMENT_PROCESSED
    ) {
      throw new BadRequestException(
        'Cannot upload documents to a finalized claim',
      );
    }

    // Save each document
    for (const doc of documents) {
      await this.claimDocumentRepository.save({
        claimId,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        notes: doc.notes,
      });
    }

    // Update claim status back to under_review if it was document_required
    if (claim.status === ClaimStatus.DOCUMENT_REQUIRED) {
      claim.status = ClaimStatus.UNDER_REVIEW;
    }

    const updatedClaim = await this.claimRepository.save(claim);

    // Notify admins that documents were uploaded
    await this.notificationService.notifyRoles(
      [UserRole.ADMIN, UserRole.OWNER],
      NotificationType.CLAIM_STATUS_UPDATED,
      'Documents Uploaded',
      `${documents.length} document(s) uploaded for claim ${claimId}`,
      '/admin/claims',
      claimId,
    );

    await this.auditLogRepository.save({
      action: 'CLAIM_DOCUMENTS_UPLOADED',
      entity: 'Claim',
      entityId: claimId,
      performedById: userId,
      newValue: {
        documentCount: documents.length,
        types: documents.map((d) => d.documentType),
      },
    });

    return updatedClaim;
  }

  /**
   * Get documents for a claim
   */
  async getClaimDocuments(
    claimId: string,
    userId: string,
    userRole: string,
  ): Promise<ClaimDocument[]> {
    const where: any = { claimId };

    // Members can only see their own claim documents
    if (userRole === UserRole.MEMBER) {
      const claim = await this.claimRepository.findOne({
        where: { id: claimId, memberId: userId },
      });
      if (!claim) throw new NotFoundException('Claim not found');
    }

    return this.claimDocumentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Admin verifies a document
   */
  async verifyDocument(
    documentId: string,
    adminId: string,
  ): Promise<ClaimDocument> {
    const doc = await this.claimDocumentRepository.findOne({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    doc.isVerified = true;
    return this.claimDocumentRepository.save(doc);
  }

  /**
   * Validate allowed status transitions
   */
  private validateStatusTransition(
    current: ClaimStatus,
    next: ClaimStatus,
  ): void {
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
        `Cannot transition from ${current} to ${next}. Allowed: ${
          allowed?.join(', ') || 'none'
        }`,
      );
    }
  }
}
