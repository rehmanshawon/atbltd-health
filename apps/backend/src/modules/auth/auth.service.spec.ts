import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Agent } from '../../entities/agent.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';
import { OtpService } from './otp.service';
import { PaymentRoutingService } from './payment-routing.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
describe('AuthService', () => {
  let service: AuthService;

  // Mock repositories
  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockMembershipRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockPaymentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockAuditLogRepository = {
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockAgentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockNotificationService = {
    notifyRoles: jest.fn(),
    notifyUser: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
    sendMembershipActivationSms: jest.fn(),
  };

  const mockOtpService = {
    issueMemberOtp: jest.fn(),
    issueStaffOtp: jest.fn(),
    verifyMemberOtp: jest.fn(),
    verifyStaffOtp: jest.fn(),
  };

  const mockPaymentRoutingService = {
    getRecipientAccount: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest
          .fn()
          .mockImplementation((entity) => Promise.resolve({ id: 'uuid-123', ...entity })),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxId: 'ATB-26-ME-05' }),
        }),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
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
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: PaymentRoutingService, useValue: mockPaymentRoutingService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Force reset all mock functions
    mockUserRepository.findOne.mockReset();
    mockUserRepository.findOne.mockImplementation(() => Promise.resolve(undefined));

    mockUserRepository.save.mockReset();
    mockUserRepository.create.mockReset();
    mockMembershipRepository.findOne.mockReset();
    mockMembershipRepository.save.mockReset();
    mockMembershipRepository.create.mockReset();
    mockPaymentRepository.findOne.mockReset();
    mockPaymentRepository.save.mockReset();
    mockPaymentRepository.create.mockReset();
    mockAuditLogRepository.save.mockReset();
    mockAuditLogRepository.create.mockReset();
    mockAgentRepository.findOne.mockReset();
    mockAgentRepository.save.mockReset();
    mockNotificationService.notifyRoles.mockReset();
    mockNotificationService.notifyUser.mockReset();
    mockSmsService.sendSms.mockReset();
    mockOtpService.issueMemberOtp.mockReset();
    mockOtpService.issueStaffOtp.mockReset();
    mockOtpService.verifyMemberOtp.mockReset();
    mockOtpService.verifyStaffOtp.mockReset();
    mockPaymentRoutingService.getRecipientAccount.mockReset();
    mockPaymentRoutingService.getRecipientAccount.mockImplementation((method) => {
      if (method === 'paypal') {
        throw new BadRequestException('Invalid payment method');
      }
      return '01XXXXXXXXX';
    });
  });

  describe('login', () => {
    it('should login successfully with valid staff ID and password', async () => {
      const staffUser = {
        id: 'uuid-1',
        memberId: 'ATB-26-SA-1',
        fullName: 'System Administrator',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        mobileNumber: '01700000000',
        password: '$2b$12$hashedpassword',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(staffUser);
      mockUserRepository.save.mockResolvedValue(staffUser);

      //const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        identifier: 'ATB-26-SA-1',
        password: 'Admin@ATB2026',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.memberId).toBe('ATB-26-SA-1');
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const staffUser = {
        id: 'uuid-1',
        memberId: 'ATB-26-SA-1',
        fullName: 'System Administrator',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        mobileNumber: '01700000000',
        password: '$2b$12$hashedpassword',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(staffUser);

      //const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ identifier: 'ATB-26-SA-1', password: 'WrongPass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown user', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.login({ identifier: 'ATB-26-XX-9', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject member login with staff login endpoint', async () => {
      const memberUser = {
        id: 'uuid-2',
        memberId: 'ATB-26-ME-01',
        fullName: 'Sample Member',
        role: UserRole.MEMBER,
        isActive: true,
        mobileNumber: '01710000002',
        password: '$2b$12$hashed',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(memberUser);

      await expect(
        service.login({ identifier: 'ATB-26-ME-01', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('memberLogin', () => {
    it('should login member with ID only', async () => {
      const memberUser = {
        id: 'uuid-2',
        memberId: 'ATB-26-ME-01',
        fullName: 'Sample Member',
        role: UserRole.MEMBER,
        isActive: true,
        mobileNumber: '01710000002',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(memberUser);
      mockUserRepository.save.mockResolvedValue(memberUser);

      const result = await service.memberLogin('atb-26-me-01');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.memberId).toBe('ATB-26-ME-01');
      expect(result.user.role).toBe(UserRole.MEMBER);
    });

    it('should normalize input to uppercase with ATB prefix', async () => {
      const memberUser = {
        id: 'uuid-2',
        memberId: 'ATB-26-ME-01',
        fullName: 'Sample Member',
        role: UserRole.MEMBER,
        isActive: true,
        mobileNumber: '01710000002',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(memberUser);
      mockUserRepository.save.mockResolvedValue(memberUser);

      await service.memberLogin('26-me-01');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { memberId: 'ATB-26-ME-01', role: UserRole.MEMBER },
      });
    });

    it('should throw UnauthorizedException for inactive member', async () => {
      const inactiveMember = {
        id: 'uuid-3',
        memberId: 'ATB-26-ME-02',
        fullName: 'Inactive Member',
        role: UserRole.MEMBER,
        isActive: false,
        mobileNumber: '01710000003',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(inactiveMember);

      await expect(service.memberLogin('ATB-26-ME-02')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should throw ConflictException for duplicate NID', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'uuid-existing',
        nid: '1234567890',
      });

      await expect(
        service.register({
          fullName: 'Test User',
          mobileNumber: '01712345678',
          nid: '1234567890',
          paymentMethod: 'bkash',
          senderAccount: '01712345678',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for duplicate mobile', async () => {
      // Mock the findOne method specifically for this test
      mockUserRepository.findOne.mockImplementation((query: any) => {
        if (query?.where?.nid) {
          // NID check — not found
          return Promise.resolve(null);
        }
        if (query?.where?.mobileNumber) {
          // Mobile check — found existing
          return Promise.resolve({
            id: 'uuid-existing',
            mobileNumber: '01712345678',
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.register({
          fullName: 'Test User',
          mobileNumber: '01712345678',
          paymentMethod: 'bkash',
          senderAccount: '01712345678',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid payment method', async () => {
      mockUserRepository.findOne.mockImplementation((query: any) => {
        return Promise.resolve(null); // Both NID and mobile not found
      });

      await expect(
        service.register({
          fullName: 'Test User',
          mobileNumber: '01712345678',
          paymentMethod: 'paypal',
          senderAccount: '01712345678',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
