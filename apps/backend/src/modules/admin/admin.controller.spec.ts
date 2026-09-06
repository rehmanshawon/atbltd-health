import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FraudService } from './fraud.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentStatus } from '../../entities/payment.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;
  let fraudService: FraudService;

  const mockAdminService = {
    getDashboardStats: jest.fn(),
    getAgentDashboardStats: jest.fn(),
    getPayments: jest.fn(),
    getPendingPayments: jest.fn(),
    verifyPayment: jest.fn(),
    getAuditLogs: jest.fn(),
  };

  const mockFraudService = {
    runFraudChecks: jest.fn(),
    checkUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: FraudService, useValue: mockFraudService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
    fraudService = module.get<FraudService>(FraudService);
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('calls getDashboardStats for SUPER_ADMIN', async () => {
      mockAdminService.getDashboardStats.mockResolvedValue({ stats: true });
      const result = await controller.getDashboard({
        role: UserRole.SUPER_ADMIN,
        sub: 'admin-1',
      } as any);
      expect(result).toEqual({ stats: true });
      expect(adminService.getDashboardStats).toHaveBeenCalled();
    });

    it('calls getAgentDashboardStats for OWNER', async () => {
      mockAdminService.getAgentDashboardStats.mockResolvedValue({ agentStats: true });
      const result = await controller.getDashboard({ role: UserRole.OWNER, sub: 'owner-1' } as any);
      expect(result).toEqual({ agentStats: true });
      expect(adminService.getAgentDashboardStats).toHaveBeenCalledWith('owner-1');
    });

    it('returns empty default stats for unhandled roles', async () => {
      const result = await controller.getDashboard({ role: 'UNKNOWN', sub: 'x' } as any);
      expect(result.members.total).toBe(0);
    });
  });

  describe('getPayments', () => {
    it('calls adminService.getPayments with pagination and status', async () => {
      mockAdminService.getPayments.mockResolvedValue([]);
      const result = await controller.getPayments(1, 10, PaymentStatus.PENDING);
      expect(result).toEqual([]);
      expect(adminService.getPayments).toHaveBeenCalledWith(PaymentStatus.PENDING, 1, 10);
    });
  });

  describe('getPendingPayments', () => {
    it('calls adminService.getPendingPayments with user role', async () => {
      mockAdminService.getPendingPayments.mockResolvedValue([]);
      const result = await controller.getPendingPayments({ role: UserRole.ADMIN } as any);
      expect(result).toEqual([]);
      expect(adminService.getPendingPayments).toHaveBeenCalledWith(UserRole.ADMIN);
    });
  });

  describe('verifyPayment', () => {
    it('calls adminService.verifyPayment', async () => {
      mockAdminService.verifyPayment.mockResolvedValue({ verified: true });
      const result = await controller.verifyPayment('pay-1', {
        sub: 'admin-1',
        role: UserRole.ADMIN,
      } as any);
      expect(result).toEqual({ verified: true });
      expect(adminService.verifyPayment).toHaveBeenCalledWith('pay-1', 'admin-1', UserRole.ADMIN);
    });
  });

  describe('getAuditLogs', () => {
    it('calls adminService.getAuditLogs with page and limit', async () => {
      mockAdminService.getAuditLogs.mockResolvedValue([]);
      const result = await controller.getAuditLogs(1, 25);
      expect(result).toEqual([]);
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(1, 25);
    });
  });

  describe('Fraud Checks', () => {
    it('runs general fraud checks', async () => {
      mockFraudService.runFraudChecks.mockResolvedValue({ clean: true });
      const result = await controller.runFraudChecks({ sub: 'admin-1' } as any);
      expect(result).toEqual({ clean: true });
      expect(fraudService.runFraudChecks).toHaveBeenCalled();
    });

    it('checks specific user fraud status', async () => {
      mockFraudService.checkUser.mockResolvedValue({ risk: 'low' });
      const result = await controller.checkUserFraud('user-123');
      expect(result).toEqual({ risk: 'low' });
      expect(fraudService.checkUser).toHaveBeenCalledWith('user-123');
    });
  });
});
