import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentVerificationService } from './payment-verification.service';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CommissionService } from '../commission/commission.service';
import { SmsService } from '../sms/sms.service';
import { NotificationService } from '../notification/notification.service';

describe('PaymentVerificationService', () => {
  let service: PaymentVerificationService;

  const mockUserRepository = { save: jest.fn() };
  const mockMembershipRepository = { findOne: jest.fn(), save: jest.fn() };
  const mockPaymentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const mockAuditLogRepository = { save: jest.fn() };
  const mockCommissionService = { createRegistrationCommission: jest.fn() };
  const mockSmsService = { sendMembershipActivationSms: jest.fn() };
  const mockNotificationService = { notifyRoles: jest.fn(), notifyUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentVerificationService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        { provide: CommissionService, useValue: mockCommissionService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<PaymentVerificationService>(PaymentVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPayment', () => {
    it('throws NotFoundException if payment is missing', async () => {
      mockPaymentRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.verifyPayment('missing', 'admin-1', UserRole.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('handles Maker workflow (Admin review)', async () => {
      const payment = {
        id: 'p-1',
        status: PaymentStatus.PENDING,
        amount: 1000,
        user: { fullName: 'Member One', memberId: 'ATB-26-ME-01' },
      };
      mockPaymentRepository.findOne.mockResolvedValueOnce(payment);
      mockPaymentRepository.save.mockResolvedValueOnce(payment);

      const result = await service.verifyPayment('p-1', 'admin-1', UserRole.ADMIN);

      expect(result.requiresFinalApproval).toBe(true);
      expect(mockNotificationService.notifyRoles).toHaveBeenCalledWith(
        [UserRole.SUPER_ADMIN],
        expect.anything(),
        expect.anything(),
        expect.anything(),
        '/admin',
      );
    });

    it('handles Checker workflow (Super Admin authorization)', async () => {
      const payment = {
        id: 'p-1',
        status: PaymentStatus.PENDING,
        amount: 1000,
        userId: 'u-1',
        user: { fullName: 'Member One', memberId: 'ATB-26-ME-01', mobileNumber: '01700000000' },
      };
      mockPaymentRepository.findOne.mockResolvedValue(payment);
      mockPaymentRepository.update.mockResolvedValueOnce({ affected: 1 });
      mockMembershipRepository.findOne.mockResolvedValueOnce({ userId: 'u-1' });

      const result = await service.verifyPayment('p-1', 'sa-1', UserRole.SUPER_ADMIN);

      expect(result.success).toBe(true);
      expect(mockSmsService.sendMembershipActivationSms).toHaveBeenCalled();
    });
  });

  describe('getPayments & getPendingPayments', () => {
    it('returns paginated payments', async () => {
      mockPaymentRepository.findAndCount.mockResolvedValueOnce([[], 0]);
      const res = await service.getPayments(undefined, 1, 10);
      expect(res.totalPages).toBe(0);
    });

    it('filters pending payments for Super Admin', async () => {
      mockPaymentRepository.find.mockResolvedValueOnce([]);
      await service.getPendingPayments(UserRole.SUPER_ADMIN);
      expect(mockPaymentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notes: 'Reviewed by Admin. Awaiting Super Admin authorization.',
          }),
        }),
      );
    });
  });
});
