import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { User } from '../../entities/user.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentVerificationService } from './payment-verification.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockUserRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockPaymentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
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

  const mockPaymentVerificationService = {
    getPayments: jest.fn(),
    verifyPayment: jest.fn(),
    getPendingPayments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(Claim), useValue: mockClaimRepository },
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        {
          provide: PaymentVerificationService,
          useValue: mockPaymentVerificationService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);

    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should aggregate counts correctly', async () => {
      mockUserRepository.count.mockResolvedValue(10);
      mockPaymentRepository.count.mockResolvedValue(5);
      mockClaimRepository.count.mockResolvedValue(2);
      mockAgentRepository.count.mockResolvedValue(4);

      const stats = await service.getDashboardStats();

      expect(stats.members.total).toBe(10);
      expect(stats.payments.totalCollection).toBe(5000);
      expect(stats.agents.total).toBe(4);
    });
  });

  describe('Delegation to PaymentVerificationService', () => {
    it('should delegate getPayments', async () => {
      const mockResult = { payments: [], total: 0, page: 1, totalPages: 0 };
      mockPaymentVerificationService.getPayments.mockResolvedValueOnce(mockResult);

      const result = await service.getPayments(PaymentStatus.PENDING, 1, 20);

      expect(mockPaymentVerificationService.getPayments).toHaveBeenCalledWith(
        PaymentStatus.PENDING,
        1,
        20,
      );
      expect(result).toBe(mockResult);
    });

    it('should delegate verifyPayment', async () => {
      const mockResponse = { success: true, message: 'Verified' };
      mockPaymentVerificationService.verifyPayment.mockResolvedValueOnce(mockResponse);

      const result = await service.verifyPayment('payment-1', 'admin-uuid', UserRole.ADMIN);

      expect(mockPaymentVerificationService.verifyPayment).toHaveBeenCalledWith(
        'payment-1',
        'admin-uuid',
        UserRole.ADMIN,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delegate getPendingPayments for Admin', async () => {
      mockPaymentVerificationService.getPendingPayments.mockResolvedValueOnce([]);

      const result = await service.getPendingPayments(UserRole.ADMIN);

      expect(mockPaymentVerificationService.getPendingPayments).toHaveBeenCalledWith(
        UserRole.ADMIN,
      );
      expect(result).toEqual([]);
    });

    it('should delegate getPendingPayments for Super Admin', async () => {
      mockPaymentVerificationService.getPendingPayments.mockResolvedValueOnce([]);

      const result = await service.getPendingPayments(UserRole.SUPER_ADMIN);

      expect(mockPaymentVerificationService.getPendingPayments).toHaveBeenCalledWith(
        UserRole.SUPER_ADMIN,
      );
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

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      mockAuditLogRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.getAuditLogs(1, 50);

      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
