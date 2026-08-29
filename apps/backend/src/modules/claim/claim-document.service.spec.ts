import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimDocumentService } from './claim-document.service';
import { Claim } from '../../entities/claim.entity';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { User } from '../../entities/user.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';

describe('ClaimDocumentService', () => {
  let service: ClaimDocumentService;

  const mockClaimRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockClaimDocumentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockNotificationService = {
    notifyRoles: jest.fn(),
    notifyUser: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimDocumentService,
        { provide: getRepositoryToken(Claim), useValue: mockClaimRepository },
        { provide: getRepositoryToken(ClaimDocument), useValue: mockClaimDocumentRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<ClaimDocumentService>(ClaimDocumentService);

    jest.clearAllMocks();
    mockClaimRepository.findOne.mockReset();
    mockClaimRepository.save.mockReset();
    mockClaimDocumentRepository.findOne.mockReset();
    mockClaimDocumentRepository.save.mockReset();
    mockClaimDocumentRepository.find.mockReset();
    mockUserRepository.findOne.mockReset();
    mockNotificationService.notifyRoles.mockReset();
    mockNotificationService.notifyUser.mockReset();
    mockSmsService.sendSms.mockReset();
  });

  describe('uploadDocumentsWithTypes', () => {
    it('should throw NotFoundException for invalid claim', async () => {
      mockClaimRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.uploadDocumentsWithTypes('invalid-claim', 'user-1', [])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for finalized claim', async () => {
      mockClaimRepository.findOne.mockResolvedValueOnce({
        id: 'claim-1',
        status: ClaimStatus.APPROVED,
      });

      await expect(service.uploadDocumentsWithTypes('claim-1', 'user-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upload documents and update claim to UNDER_REVIEW', async () => {
      const claim = {
        id: 'claim-1',
        memberId: 'user-1',
        status: ClaimStatus.DOCUMENT_REQUIRED,
      };

      mockClaimRepository.findOne.mockResolvedValueOnce(claim);
      mockClaimDocumentRepository.save.mockResolvedValue({});
      mockClaimRepository.save.mockResolvedValue({
        ...claim,
        status: ClaimStatus.UNDER_REVIEW,
      });
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-1',
        mobileNumber: '01712345678',
      });
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockNotificationService.notifyUser.mockResolvedValue(undefined);
      mockSmsService.sendSms.mockResolvedValue(undefined);

      const result = await service.uploadDocumentsWithTypes('claim-1', 'user-1', [
        {
          documentType: 'Discharge Summary',
          fileName: 'discharge.pdf',
          fileUrl: '/uploads/discharge.pdf',
        },
      ]);

      expect(result.status).toBe(ClaimStatus.UNDER_REVIEW);
      expect(mockClaimDocumentRepository.save).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
    });

    it('should send SMS to member on document upload', async () => {
      const claim = {
        id: 'claim-1',
        memberId: 'user-1',
        status: ClaimStatus.SUBMITTED,
      };

      mockClaimRepository.findOne.mockResolvedValueOnce(claim);
      mockClaimDocumentRepository.save.mockResolvedValue({});
      mockClaimRepository.save.mockResolvedValue(claim);
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-1',
        mobileNumber: '01712345678',
      });
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockNotificationService.notifyUser.mockResolvedValue(undefined);
      mockSmsService.sendSms.mockResolvedValue(undefined);

      await service.uploadDocumentsWithTypes('claim-1', 'user-1', [
        { documentType: 'OT Note', fileName: 'ot.pdf', fileUrl: '/uploads/ot.pdf' },
      ]);

      expect(mockSmsService.sendSms).toHaveBeenCalledWith(
        '01712345678',
        expect.stringContaining('ATB Ltd'),
      );
    });
  });

  describe('getClaimDocuments', () => {
    it('should throw NotFoundException when member tries to access other member documents', async () => {
      mockClaimRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getClaimDocuments('claim-1', 'user-2', UserRole.MEMBER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return documents for admin', async () => {
      mockClaimDocumentRepository.find.mockResolvedValueOnce([
        { id: 'doc-1', documentType: 'Discharge Summary', fileName: 'test.pdf' },
      ]);

      const result = await service.getClaimDocuments('claim-1', 'admin-1', UserRole.ADMIN);

      expect(result.length).toBe(1);
    });
  });

  describe('verifyDocument', () => {
    it('should throw NotFoundException for invalid document', async () => {
      mockClaimDocumentRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.verifyDocument('invalid-doc', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mark document as verified', async () => {
      const doc = {
        id: 'doc-1',
        documentType: 'Discharge Summary',
        isVerified: false,
      };

      mockClaimDocumentRepository.findOne.mockResolvedValueOnce(doc);
      mockClaimDocumentRepository.save.mockResolvedValue({ ...doc, isVerified: true });

      const result = await service.verifyDocument('doc-1', 'admin-1');

      expect(result.isVerified).toBe(true);
    });
  });
});
