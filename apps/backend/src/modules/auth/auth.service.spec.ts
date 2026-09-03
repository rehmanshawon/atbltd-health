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
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 'ATB-26-SA-1' }),
        { expiresIn: '8h' },
      );
    });

    it('should issue a 12-hour session for owners and agents', async () => {
      const ownerUser = {
        id: 'uuid-owner',
        memberId: 'ATB-26-OW-1',
        fullName: 'Owner',
        role: UserRole.OWNER,
        isActive: true,
        mobileNumber: '01710000001',
        password: 'hashed',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(ownerUser);
      mockUserRepository.save.mockResolvedValue(ownerUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login({ identifier: ownerUser.memberId, password: 'password' });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: ownerUser.memberId }),
        { expiresIn: '12h' },
      );
    });

    it('should issue the role-specific session when staff OTP is verified', async () => {
      const agentUser = {
        id: 'uuid-agent',
        memberId: 'ATB-26-AG-1',
        fullName: 'Agent',
        role: UserRole.AGENT,
        isActive: true,
        mobileNumber: '01710000002',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(agentUser);

      await service.verifyStaffOtp(agentUser.memberId, '123456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: agentUser.memberId }),
        { expiresIn: '12h' },
      );
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

    it('should reject inactive staff accounts', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        memberId: 'ATB-26-SA-1',
        role: UserRole.ADMIN,
        isActive: false,
      });

      await expect(
        service.login({ identifier: 'ATB-26-SA-1', password: 'password' }),
      ).rejects.toThrow('Your account is not active');
    });

    it('should find staff by mobile number when the staff ID is not found', async () => {
      const staffUser = {
        id: 'uuid-4',
        memberId: 'ATB-26-AG-1',
        fullName: 'Agent',
        role: UserRole.AGENT,
        isActive: true,
        mobileNumber: '01710000001',
        password: 'hashed',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(staffUser);
      mockUserRepository.save.mockResolvedValue(staffUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({ identifier: '01710000001', password: 'password' });

      expect(result.user.memberId).toBe('ATB-26-AG-1');
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { mobileNumber: '01710000001' },
      });
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

  describe('OTP and profile flows', () => {
    it('should send a member OTP for a registered mobile number', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'uuid-1' });
      mockOtpService.issueMemberOtp.mockReturnValue('123456');

      await expect(service.sendOtp('01710000000')).resolves.toEqual({
        success: true,
        message: 'OTP sent successfully. Valid for 5 minutes.',
      });
      expect(mockOtpService.issueMemberOtp).toHaveBeenCalledWith('01710000000');
    });

    it('should reject OTP requests for unknown mobile numbers', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.sendOtp('01710000000')).rejects.toThrow(BadRequestException);
    });

    it('should verify a member OTP and return a token', async () => {
      const member = {
        id: 'uuid-1',
        memberId: 'ATB-26-ME-01',
        fullName: 'Member',
        role: UserRole.MEMBER,
        isActive: false,
        mobileNumber: '01710000000',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(member);

      await expect(
        service.verifyOtp({ mobileNumber: '01710000000', otp: '123456' }),
      ).resolves.toMatchObject({ success: true, accessToken: 'mock-jwt-token' });
      expect(mockOtpService.verifyMemberOtp).toHaveBeenCalledWith('01710000000', '123456');
    });

    it('should reject OTP verification when the user cannot be found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.verifyOtp({ mobileNumber: '01710000000', otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a profile without the password', async () => {
      const user = { id: 'uuid-1', fullName: 'Member', password: 'secret' } as User;
      mockUserRepository.findOne.mockResolvedValueOnce(user);

      const result = await service.getProfile('uuid-1');

      expect(result).toBe(user);
      expect(result.password).toBeUndefined();
    });

    it('should reject profile lookup for an unknown user', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getProfile('missing')).rejects.toThrow(UnauthorizedException);
    });

    it('should send staff OTP and tolerate an SMS failure', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'uuid-1',
        memberId: 'ATB-26-SA-1',
        role: UserRole.ADMIN,
        mobileNumber: '01710000000',
      });
      mockOtpService.issueStaffOtp.mockReturnValue('654321');
      mockSmsService.sendSms.mockRejectedValueOnce(new Error('Network unavailable'));

      await expect(service.sendStaffLoginOtp('ATB-26-SA-1')).resolves.toEqual({
        success: true,
        message: 'OTP sent to your mobile number',
      });
    });

    it('should reject staff OTP requests for members', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ role: UserRole.MEMBER });

      await expect(service.sendStaffLoginOtp('ATB-26-ME-01')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should update profile fields when no duplicates exist', async () => {
      const user = {
        id: 'uuid-1',
        mobileNumber: '01710000000',
        email: 'old@example.com',
        fullName: 'Old Name',
      } as User;
      mockUserRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockUserRepository.save.mockResolvedValue(user);

      await service.updateProfile('uuid-1', {
        mobileNumber: '01710000001',
        email: 'new@example.com',
        fullName: 'New Name',
      });

      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...user,
        mobileNumber: '01710000001',
        email: 'new@example.com',
        fullName: 'New Name',
      });
    });

    it('should reject profile updates with a duplicate mobile number', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ mobileNumber: '01710000000' });
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'other-user' });

      await expect(
        service.updateProfile('uuid-1', { mobileNumber: '01710000001' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
