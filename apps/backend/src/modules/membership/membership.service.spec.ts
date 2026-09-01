import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { Membership } from '../../entities/membership.entity';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';

describe('MembershipService', () => {
  let service: MembershipService;

  const mockMembershipRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockPaymentRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
    jest.clearAllMocks();
  });

  describe('getMemberDashboard', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getMemberDashboard('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns profile, membership, payments and digital card for an active member', async () => {
      const user = {
        id: 'user-1',
        memberId: 'ATB-001',
        fullName: 'Jane Doe',
        mobileNumber: '01700000000',
        email: 'jane@example.com',
        nid: '1234567890',
        permanentAddress: 'Dhaka',
        role: 'member',
        isActive: true,
        isKycVerified: true,
        createdAt: new Date('2026-01-01'),
        membership: {
          membershipFee: 1000,
          isPaymentVerified: true,
          paymentMethod: 'bkash',
          membershipStartDate: new Date('2026-01-01'),
          membershipEndDate: new Date('2027-01-01'),
          isActive: true,
          remainingBenefit: 8000,
          renewalCount: 0,
          renewalFee: 850,
        },
      };

      mockUserRepository.findOne.mockResolvedValueOnce(user);
      mockPaymentRepository.find.mockResolvedValueOnce([
        {
          id: 'p1',
          paymentType: 'membership_fee',
          amount: 1000,
          method: 'bkash',
          status: 'verified',
          transactionId: 'TXN1',
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const result = await service.getMemberDashboard('user-1');

      expect(result.profile.memberId).toBe('ATB-001');
      expect(result.membership?.remainingBenefit).toBe(8000);
      expect(result.recentPayments).toHaveLength(1);
      expect(result.digitalCard).toEqual({
        memberId: 'ATB-001',
        fullName: 'Jane Doe',
        membershipType: 'Annual Membership',
        validUntil: user.membership.membershipEndDate,
        remainingBenefit: 8000,
        isActive: true,
      });
    });

    it('returns a null membership block and zero benefit when the user has no membership', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-2',
        memberId: 'ATB-002',
        fullName: 'No Membership',
        isActive: true,
        membership: null,
      });
      mockPaymentRepository.find.mockResolvedValueOnce([]);

      const result = await service.getMemberDashboard('user-2');

      expect(result.membership).toBeNull();
      expect(result.digitalCard.remainingBenefit).toBe(0);
      expect(result.digitalCard.isActive).toBe(false);
    });
  });

  describe('getMembershipStatus', () => {
    it('throws NotFoundException when no membership exists', async () => {
      mockMembershipRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getMembershipStatus('user-1')).rejects.toThrow(NotFoundException);
    });

    it('reports benefits unavailable and days remaining during the waiting period', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5); // started 5 days ago

      mockMembershipRepository.findOne.mockResolvedValueOnce({
        user: { memberId: 'ATB-003' },
        isActive: true,
        membershipStartDate: startDate,
        membershipEndDate: null,
        remainingBenefit: 12000,
      });

      const result = await service.getMembershipStatus('user-3');

      expect(result.benefitsAvailable).toBe(false);
      expect(result.daysUntilActivation).toBeGreaterThan(0);
      expect(result.totalBenefit).toBe(12000);
    });

    it('reports benefits available once the 1-month waiting period has passed', async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 2); // started 2 months ago

      mockMembershipRepository.findOne.mockResolvedValueOnce({
        user: { memberId: 'ATB-004' },
        isActive: true,
        membershipStartDate: startDate,
        membershipEndDate: null,
        remainingBenefit: 5000,
      });

      const result = await service.getMembershipStatus('user-4');

      expect(result.benefitsAvailable).toBe(true);
      expect(result.daysUntilActivation).toBe(0);
    });
  });
});
