import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from '../../entities/claim.entity';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { SmsService } from '../sms/sms.service';
import { User } from '../../entities/user.entity';

@Injectable()
export class ClaimDocumentService {
  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    @InjectRepository(ClaimDocument)
    private readonly claimDocumentRepository: Repository<ClaimDocument>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly smsService: SmsService,
  ) {}

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

    if (!claim) throw new NotFoundException('Claim not found');

    if (
      claim.status === ClaimStatus.APPROVED ||
      claim.status === ClaimStatus.REJECTED ||
      claim.status === ClaimStatus.PAYMENT_PROCESSED
    ) {
      throw new BadRequestException('Cannot upload documents to a finalized claim');
    }

    for (const doc of documents) {
      await this.claimDocumentRepository.save({
        claimId,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        notes: doc.notes,
      });
    }

    if (claim.status === ClaimStatus.DOCUMENT_REQUIRED) {
      claim.status = ClaimStatus.UNDER_REVIEW;
    }

    const updatedClaim = await this.claimRepository.save(claim);

    await this.notificationService.notifyRoles(
      [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      NotificationType.CLAIM_STATUS_UPDATED,
      'Documents Uploaded',
      `${documents.length} document(s) uploaded for application ${claimId.substring(0, 8)}`,
      '/admin/claims',
      claimId,
    );

    const memberUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (memberUser?.mobileNumber) {
      await this.smsService.sendSms(
        memberUser.mobileNumber,
        'ATB Ltd এর মেম্বার হিসেবে আপনার চিকিৎসা বিলের তথ্য জমা হয়েছে, যাচাই শেষে বিল পরিশোধ করা হবে।',
      );
    }

    await this.notificationService.notifyUser(
      userId,
      NotificationType.CLAIM_STATUS_UPDATED,
      'Documents Received',
      'Your treatment bill information has been submitted. Bill will be paid after verification.',
      '/dashboard/claims',
      claimId,
    );

    return updatedClaim;
  }

  async getClaimDocuments(
    claimId: string,
    userId: string,
    userRole: string,
  ): Promise<ClaimDocument[]> {
    const where: any = { claimId };

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

  async verifyDocument(documentId: string, adminId: string): Promise<ClaimDocument> {
    const doc = await this.claimDocumentRepository.findOne({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    doc.isVerified = true;
    return this.claimDocumentRepository.save(doc);
  }
}
