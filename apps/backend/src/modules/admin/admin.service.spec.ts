import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CommissionService } from '../commission/commission.service';
import { SmsService } from '../sms/sms.service';
import { NotificationService } from '../notification/notification.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockUserRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockMembershipRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockPaymentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
    }),
  };

  const mockClaimRepository = {
    count: jest.fn(),
  };

  const mockAgentRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockAuditLogRepository = {
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockCommissionService = {
    createRegistrationCommission: jest.fn(),
  };

  const mockSmsService = {
    sendMembershipActivationSms: jest.fn(),
  };

  const mockNotificationService = {
    notifyUser: jest.fn(),
    notifyRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(Claim), useValue: mockClaimRepository },
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        { provide: CommissionService, useValue: mockCommissionService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);

    jest.clearAllMocks();
    mockUserRepository.count.mockReset();
    mockUserRepository.findOne.mockReset();
    mockUserRepository.save.mockReset();
    mockUserRepository.find.mockReset();
    mockMembershipRepository.findOne.mockReset();
    mockMembershipRepository.save.mockReset();
    mockPaymentRepository.findOne.mockReset();
    mockPaymentRepository.find.mockReset();
    mockPaymentRepository.save.mockReset();
    mockPaymentRepository.count.mockReset();
    mockPaymentRepository.findAndCount.mockReset();
    mockClaimRepository.count.mockReset();
    mockAgentRepository.findOne.mockReset();
    mockAgentRepository.count.mockReset();
    mockAuditLogRepository.save.mockReset();
    mockAuditLogRepository.findAndCount.mockReset();
    mockCommissionService.createRegistrationCommission.mockReset();
    mockSmsService.sendMembershipActivationSms.mockReset();
    mockNotificationService.notifyUser.mockReset();
    mockNotificationService.notifyRoles.mockReset();
  });

  describe('verifyPayment', () => {
    it('should throw NotFoundException for invalid payment', async () => {
      mockPaymentRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.verifyPayment('invalid-id', 'admin-uuid', UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already verified payment', async () => {
      mockPaymentRepository.findOne.mockResolvedValueOnce({
        id: 'payment-1',
        status: PaymentStatus.VERIFIED,
      });

      await expect(
        service.verifyPayment('payment-1', 'admin-uuid', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark as reviewed when Admin verifies (Maker)', async () => {
      const payment = {
        id: 'payment-1',
        userId: 'user-1',
        amount: 1000,
        status: PaymentStatus.PENDING,
        notes: null,
        user: {
          id: 'user-1',
          memberId: 'ATB-26-ME-01',
          fullName: 'Test Member',
          mobileNumber: '01712345678',
          referralId: null,
        },
      };

      mockPaymentRepository.findOne.mockResolvedValueOnce(payment);
      mockPaymentRepository.save.mockResolvedValue({
        ...payment,
        notes: 'Reviewed by Admin. Awaiting Super Admin authorization.',
      });

      const result = await service.verifyPayment('payment-1', 'admin-uuid', UserRole.ADMIN);

      expect(result.requiresFinalApproval).toBe(true);
      expect(result.message).toContain('Awaiting Super Admin authorization');
    });

    it('should activate membership when SA authorizes (Checker)', async () => {
      const payment = {
        id: 'payment-1',
        userId: 'user-1',
        amount: 1000,
        status: PaymentStatus.PENDING,
        user: {
          id: 'user-1',
          memberId: 'ATB-26-ME-01',
          fullName: 'Test Member',
          mobileNumber: '01712345678',
          referralId: null,
        },
      };

      mockPaymentRepository.findOne.mockResolvedValueOnce(payment);
      mockPaymentRepository.save.mockResolvedValue({
        ...payment,
        status: PaymentStatus.VERIFIED,
      });
      mockMembershipRepository.findOne.mockResolvedValueOnce({
        userId: 'user-1',
        isPaymentVerified: false,
        isActive: false,
      });
      mockMembershipRepository.save.mockResolvedValue({});
      mockUserRepository.save.mockResolvedValue({ ...payment.user, isActive: true });
      mockNotificationService.notifyUser.mockResolvedValue(undefined);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockSmsService.sendMembershipActivationSms.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      const result = await service.verifyPayment('payment-1', 'sa-uuid', UserRole.SUPER_ADMIN);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Payment authorized');
    });
  });

  describe('getPendingPayments', () => {
    it('should return fresh pending payments for Admin', async () => {
      mockPaymentRepository.find.mockResolvedValueOnce([]);

      const result = await service.getPendingPayments(UserRole.ADMIN);

      expect(result).toEqual([]);
    });

    it('should return reviewed payments for SA', async () => {
      mockPaymentRepository.find.mockResolvedValueOnce([]);

      const result = await service.getPendingPayments(UserRole.SUPER_ADMIN);

      expect(result).toEqual([]);
    });
  });

  describe('getAgentDashboardStats', () => {
    it('should return zero stats when agent not found', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.getAgentDashboardStats('user-uuid');

      expect(result.members.total).toBe(0);
      expect(result.commissions.totalEarned).toBe(0);
    });

    it('should return agent stats when agent found', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({
        id: 'agent-uuid',
        agentCode: 'ATB-26-AG-1',
        totalCommissionEarned: 500,
        totalCommissionPaid: 200,
      });
      mockUserRepository.count.mockResolvedValueOnce(10);
      mockUserRepository.count.mockResolvedValueOnce(7);
      mockAgentRepository.count.mockResolvedValueOnce(3);

      const result = await service.getAgentDashboardStats('user-uuid');

      expect(result.members.total).toBe(10);
      expect(result.members.active).toBe(7);
      expect(result.commissions.totalEarned).toBe(500);
      expect(result.agents.total).toBe(3);
    });
  });
});
