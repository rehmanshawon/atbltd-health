import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { Claim } from '../../entities/claim.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { User } from '../../entities/user.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';

describe('ClaimService', () => {
  let service: ClaimService;

  const mockClaimRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockMembershipRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockPaymentRepository = {
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
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
    sendClaimStatusSms: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimService,
        { provide: getRepositoryToken(Claim), useValue: mockClaimRepository },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: getRepositoryToken(ClaimDocument),
          useValue: mockClaimDocumentRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<ClaimService>(ClaimService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitClaim', () => {
    it('should throw BadRequestException when no active membership', async () => {
      mockMembershipRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.submitClaim('user-1', {
          surgeryType: 'Dengue Fever',
          hospitalName: 'Square Hospital',
          admissionDate: '2026-08-15',
          claimedAmount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when waiting period not passed', async () => {
      const recentMembership = {
        membershipStartDate: new Date(), // Today — waiting period not passed
        remainingBenefit: 12000,
        isActive: true,
      };

      mockMembershipRepository.findOne.mockResolvedValueOnce(recentMembership);

      await expect(
        service.submitClaim('user-1', {
          surgeryType: 'Appendectomy',
          hospitalName: 'DMCH',
          admissionDate: '2026-08-15',
          claimedAmount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when benefit exhausted', async () => {
      const oldMembership = {
        membershipStartDate: new Date('2026-06-01'),
        remainingBenefit: 0,
        isActive: true,
      };

      mockMembershipRepository.findOne.mockResolvedValueOnce(oldMembership);

      await expect(
        service.submitClaim('user-1', {
          surgeryType: 'Hernia Repair',
          hospitalName: 'Square Hospital',
          admissionDate: '2026-08-15',
          claimedAmount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount exceeds remaining benefit', async () => {
      const membership = {
        membershipStartDate: new Date('2026-06-01'),
        remainingBenefit: 3000,
        isActive: true,
      };

      mockMembershipRepository.findOne.mockResolvedValueOnce(membership);

      await expect(
        service.submitClaim('user-1', {
          surgeryType: 'C-Section',
          hospitalName: 'Apollo',
          admissionDate: '2026-08-15',
          claimedAmount: 5000, // More than remaining 3000
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully submit claim', async () => {
      const membership = {
        membershipStartDate: new Date('2026-06-01'),
        remainingBenefit: 12000,
        isActive: true,
      };

      mockMembershipRepository.findOne.mockResolvedValueOnce(membership);

      const savedClaim = {
        id: 'claim-1',
        memberId: 'user-1',
        surgeryType: 'Dengue Fever',
        hospitalName: 'Square Hospital',
        status: ClaimStatus.SUBMITTED,
      };

      mockClaimRepository.create.mockReturnValue(savedClaim);
      mockClaimRepository.save.mockResolvedValue(savedClaim);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      const result = await service.submitClaim('user-1', {
        surgeryType: 'Dengue Fever',
        hospitalName: 'Square Hospital',
        admissionDate: '2026-08-15',
        claimedAmount: 5000,
      });

      expect(result.status).toBe(ClaimStatus.SUBMITTED);
      expect(mockClaimRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateClaimStatus — Maker-Checker', () => {
    it('should allow Admin (Maker) to do first approval', async () => {
      const claim = {
        id: 'claim-1',
        memberId: 'member-1',
        status: ClaimStatus.UNDER_REVIEW,
        claimedAmount: 5000,
        reviewedBy: null,
        approvedBy: null,
      };

      mockClaimRepository.findOne.mockResolvedValueOnce(claim);
      mockClaimRepository.save.mockResolvedValue({
        ...claim,
        status: ClaimStatus.UNDER_REVIEW,
      });

      const result = await service.updateClaimStatus(
        'claim-1',
        ClaimStatus.APPROVED,
        'admin-1',
        UserRole.ADMIN,
        { approvedAmount: 5000 },
      );

      expect(result.status).toBe(ClaimStatus.UNDER_REVIEW); // Still under review until SA
    });

    it('should reject same Admin from approving twice', async () => {
      const claim = {
        id: 'claim-1',
        memberId: 'member-1',
        status: ClaimStatus.UNDER_REVIEW,
        claimedAmount: 5000,
        reviewedBy: 'admin-1', // Already reviewed by this admin
        approvedBy: 'admin-1',
      };

      mockClaimRepository.findOne.mockResolvedValueOnce(claim);

      await expect(
        service.updateClaimStatus('claim-1', ClaimStatus.APPROVED, 'admin-1', UserRole.ADMIN, {
          approvedAmount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow Super Admin (Checker) to give final approval', async () => {
      const claim = {
        id: 'claim-1',
        memberId: 'member-1',
        status: ClaimStatus.UNDER_REVIEW,
        claimedAmount: 5000,
        reviewedBy: null,
      };

      mockClaimRepository.findOne.mockResolvedValueOnce(claim);
      mockClaimRepository.save.mockResolvedValue({
        ...claim,
        status: ClaimStatus.APPROVED,
      });

      mockNotificationService.notifyUser.mockResolvedValue(undefined);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockSmsService.sendClaimStatusSms.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      const result = await service.updateClaimStatus(
        'claim-1',
        ClaimStatus.APPROVED,
        'sa-1',
        UserRole.SUPER_ADMIN,
        { approvedAmount: 5000 },
      );

      expect(result.status).toBe(ClaimStatus.APPROVED);
    });

    it('should throw NotFoundException for invalid claim', async () => {
      mockClaimRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateClaimStatus('nonexistent', ClaimStatus.APPROVED, 'admin-1', UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
