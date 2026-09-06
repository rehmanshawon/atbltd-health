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

    it('returns success when a Super Admin retries an authorized payment', async () => {
      mockPaymentRepository.findOne.mockResolvedValueOnce({
        id: 'p-1',
        status: PaymentStatus.VERIFIED,
      });

      await expect(service.verifyPayment('p-1', 'sa-1', UserRole.SUPER_ADMIN)).resolves.toEqual({
        success: true,
        message: 'Payment was already authorized',
      });
    });

    it('rejects non-pending payments for non-Super Admins', async () => {
      mockPaymentRepository.findOne.mockResolvedValueOnce({
        id: 'p-1',
        status: PaymentStatus.VERIFIED,
      });

      await expect(service.verifyPayment('p-1', 'admin-1', UserRole.ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns success when authorization races with another verifier', async () => {
      mockPaymentRepository.findOne.mockResolvedValueOnce({
        id: 'p-1',
        status: PaymentStatus.PENDING,
      });
      mockPaymentRepository.update.mockResolvedValueOnce({ affected: 0 });
      mockPaymentRepository.findOne.mockResolvedValueOnce({
        id: 'p-1',
        status: PaymentStatus.VERIFIED,
      });

      await expect(service.verifyPayment('p-1', 'sa-1', UserRole.SUPER_ADMIN)).resolves.toEqual({
        success: true,
        message: 'Payment was already authorized',
      });
    });

    it('rejects when authorization affects no payment and it remains pending', async () => {
      mockPaymentRepository.findOne.mockResolvedValueOnce({
        id: 'p-1',
        status: PaymentStatus.PENDING,
      });
      mockPaymentRepository.update.mockResolvedValueOnce({ affected: 0 });
      mockPaymentRepository.findOne.mockResolvedValueOnce({
        id: 'p-1',
        status: PaymentStatus.PENDING,
      });

      await expect(service.verifyPayment('p-1', 'sa-1', UserRole.SUPER_ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPayments & getPendingPayments', () => {
    it('returns paginated payments', async () => {
      mockPaymentRepository.findAndCount.mockResolvedValueOnce([[], 0]);
      const res = await service.getPayments(undefined, 1, 10);
      expect(res.totalPages).toBe(0);
    });

    it('filters payments and falls back to default pagination values', async () => {
      mockPaymentRepository.findAndCount.mockResolvedValueOnce([[{ id: 'p-1' }], 1]);

      const res = await service.getPayments(PaymentStatus.PENDING, 0, 0);

      expect(res.payments).toEqual([{ id: 'p-1' }]);
      expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: PaymentStatus.PENDING },
          skip: 0,
          take: 20,
        }),
      );
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

    it('filters pending payments for Admin', async () => {
      mockPaymentRepository.find.mockResolvedValueOnce([]);

      await service.getPendingPayments(UserRole.ADMIN);

      expect(mockPaymentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: PaymentStatus.PENDING, notes: null },
        }),
      );
    });
  });

  describe('activateMembership', () => {
    it('activates the user and records payment without optional referral or SMS', async () => {
      const payment = {
        id: 'p-1',
        userId: 'u-1',
        amount: 1000,
        user: { fullName: 'Member One', memberId: 'ATB-26-ME-01' },
      } as any;
      mockMembershipRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.save.mockResolvedValue(payment.user);
      mockNotificationService.notifyUser.mockResolvedValue(undefined);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      await service.activateMembership(payment, 'sa-1');

      expect(mockUserRepository.save).toHaveBeenCalledWith(payment.user);
      expect(mockSmsService.sendMembershipActivationSms).not.toHaveBeenCalled();
      expect(mockCommissionService.createRegistrationCommission).not.toHaveBeenCalled();
    });

    it('continues activation when SMS and commission creation fail', async () => {
      const payment = {
        id: 'p-1',
        userId: 'u-1',
        amount: 1000,
        user: {
          fullName: 'Member One',
          memberId: 'ATB-26-ME-01',
          mobileNumber: '01700000000',
          referralId: 'ref-1',
        },
      } as any;
      mockMembershipRepository.findOne.mockResolvedValueOnce({ userId: 'u-1' });
      mockMembershipRepository.save.mockResolvedValue(payment);
      mockUserRepository.save.mockResolvedValue(payment.user);
      mockSmsService.sendMembershipActivationSms.mockRejectedValueOnce(new Error('SMS failed'));
      mockCommissionService.createRegistrationCommission.mockRejectedValueOnce(
        new Error('Commission failed'),
      );
      mockNotificationService.notifyUser.mockResolvedValue(undefined);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      await expect(service.activateMembership(payment, 'sa-1')).resolves.toBeUndefined();
      expect(mockMembershipRepository.save).toHaveBeenCalled();
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });
  });
});
