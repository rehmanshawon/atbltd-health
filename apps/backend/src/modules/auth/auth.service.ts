import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment, PaymentStatus, PaymentType } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Agent } from '../../entities/agent.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { OtpService } from './otp.service';
import { PaymentRoutingService } from './payment-routing.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private getSessionDuration(role: UserRole): '8h' | '12h' {
    return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN ? '8h' : '12h';
  }

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly otpService: OtpService,
    private readonly paymentRoutingService: PaymentRoutingService,
  ) {}

  /**
   * Register a new member with payment info in an atomic transaction
   */
  async register(registerDto: RegisterDto): Promise<{
    success: boolean;
    message: string;
    memberId?: string;
    temporaryPassword?: string;
  }> {
    if (registerDto.nid) {
      const existingNid = await this.userRepository.findOne({
        where: { nid: registerDto.nid },
      });
      if (existingNid) {
        throw new ConflictException('A member with this NID already exists');
      }
    }

    const existingMobile = await this.userRepository.findOne({
      where: { mobileNumber: registerDto.mobileNumber },
    });
    if (existingMobile) {
      throw new ConflictException('A member with this mobile number already exists');
    }

    const recipientAccount = this.paymentRoutingService.getRecipientAccount(
      registerDto.paymentMethod,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const memberId = await this.generateMemberId(queryRunner);
      const temporaryPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      const user = this.userRepository.create({
        memberId,
        fullName: registerDto.fullName,
        fatherName: registerDto.fatherName,
        motherName: registerDto.motherName,
        dateOfBirth: registerDto.dateOfBirth ? new Date(registerDto.dateOfBirth) : null,
        nid: registerDto.nid,
        mobileNumber: registerDto.mobileNumber,
        email: registerDto.email,
        permanentAddress: registerDto.permanentAddress,
        currentAddress: registerDto.currentAddress,
        password: hashedPassword,
        role: UserRole.MEMBER,
        referralId: registerDto.referralId,
        isActive: false,
        isKycVerified: false,
      });

      const savedUser = await queryRunner.manager.save(user);

      await this.notificationService.notifyRoles(
        [UserRole.ADMIN, UserRole.OWNER],
        NotificationType.MEMBER_REGISTERED,
        'New Member Registered',
        `${savedUser.fullName} submitted a membership application.`,
        '/admin/members',
        savedUser.id,
      );

      const membership = this.membershipRepository.create({
        userId: savedUser.id,
        membershipFee: 1000.0,
        isPaymentVerified: false,
        paymentMethod: registerDto.paymentMethod,
        isActive: false,
        remainingBenefit: 12000.0,
        renewalFee: 850.0,
      });

      await queryRunner.manager.save(membership);

      const payment = this.paymentRepository.create({
        userId: savedUser.id,
        paymentType: PaymentType.MEMBERSHIP_FEE,
        amount: 1000.0,
        method: registerDto.paymentMethod,
        senderAccount: registerDto.senderAccount || registerDto.mobileNumber,
        recipientAccount: recipientAccount,
        status: PaymentStatus.PENDING,
      });

      await queryRunner.manager.save(payment);

      const auditLog = this.auditLogRepository.create({
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: savedUser.id,
        newValue: {
          memberId: savedUser.memberId,
          fullName: savedUser.fullName,
          mobileNumber: savedUser.mobileNumber,
          role: savedUser.role,
        },
      });

      await queryRunner.manager.save(auditLog);

      if (registerDto.referralId) {
        const referringAgent = await this.agentRepository.findOne({
          where: { agentCode: registerDto.referralId, isActive: true },
        });

        if (referringAgent) {
          referringAgent.totalMembersRegistered += 1;
          await queryRunner.manager.save(referringAgent);
        }
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message:
          'Registration successful. Your membership will be activated after payment verification. You will receive an SMS with your temporary password.',
        memberId: savedUser.memberId,
        temporaryPassword,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(`Registration failed: ${errorMessage}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Staff login with Staff ID or Mobile Number + password
   */
  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: {
      memberId: string;
      fullName: string;
      role: UserRole;
      isActive: boolean;
    };
  }> {
    const { identifier, password } = loginDto;
    const normalizedIdentifier = identifier.includes('ATB') ? identifier.toUpperCase() : identifier;

    let user = await this.userRepository.findOne({
      where: { memberId: normalizedIdentifier },
    });

    if (!user) {
      user = await this.userRepository.findOne({
        where: { mobileNumber: identifier },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid Staff ID or Mobile Number');
    }

    if (user.role === UserRole.MEMBER) {
      throw new UnauthorizedException('Members must login with Member ID only. Use Member Login.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is not active. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const payload: JwtPayload = {
      sub: user.id,
      memberId: user.memberId,
      role: user.role,
      mobileNumber: user.mobileNumber,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.getSessionDuration(user.role),
      }),
      user: {
        memberId: user.memberId,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Dispatch OTP for mobile registration verification
   */
  async sendOtp(mobileNumber: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { mobileNumber },
    });

    if (!user) {
      throw new BadRequestException('No registration found for this mobile number');
    }

    return this.otpService.sendMemberOtp(mobileNumber);
  }

  /**
   * Verify OTP and issue JWT access token
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
  }> {
    this.otpService.verifyMemberOtp(verifyOtpDto.mobileNumber, verifyOtpDto.otp);

    const user = await this.userRepository.findOne({
      where: { mobileNumber: verifyOtpDto.mobileNumber },
      relations: ['membership'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      memberId: user.memberId,
      role: user.role,
      mobileNumber: user.mobileNumber,
    };

    return {
      success: true,
      message: 'OTP verified successfully.',
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * Member login with only Member ID
   */
  async memberLogin(memberId: string): Promise<{
    accessToken: string;
    user: {
      memberId: string;
      fullName: string;
      role: UserRole;
      isActive: boolean;
    };
  }> {
    let normalizedId = memberId.trim().toUpperCase();
    if (!normalizedId.startsWith('ATB-')) {
      normalizedId = `ATB-${normalizedId}`;
    }

    const user = await this.userRepository.findOne({
      where: { memberId: normalizedId, role: UserRole.MEMBER },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Member ID');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your membership is not yet active. Please contact support.');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const payload: JwtPayload = {
      sub: user.id,
      memberId: user.memberId,
      role: user.role,
      mobileNumber: user.mobileNumber,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        memberId: user.memberId,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Send OTP for staff login
   */
  async sendStaffLoginOtp(staffId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { memberId: staffId.toUpperCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Staff ID');
    }

    if (user.role === UserRole.MEMBER) {
      throw new UnauthorizedException('Members do not use MFA');
    }

    return this.otpService.sendStaffOtp(user.id, user.mobileNumber);
  }

  /**
   * Verify staff OTP and complete login
   */
  async verifyStaffOtp(
    staffId: string,
    otp: string,
  ): Promise<{
    accessToken: string;
    user: { memberId: string; fullName: string; role: UserRole; isActive: boolean };
  }> {
    const user = await this.userRepository.findOne({
      where: { memberId: staffId.toUpperCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Staff ID');
    }

    this.otpService.verifyStaffOtp(user.id, otp);

    const payload: JwtPayload = {
      sub: user.id,
      memberId: user.memberId,
      role: user.role,
      mobileNumber: user.mobileNumber,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.getSessionDuration(user.role),
      }),
      user: {
        memberId: user.memberId,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['membership'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    delete user.password;
    return user;
  }

  async updateProfile(
    userId: string,
    data: { mobileNumber?: string; email?: string; fullName?: string },
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (data.mobileNumber && data.mobileNumber !== user.mobileNumber) {
      const existing = await this.userRepository.findOne({
        where: { mobileNumber: data.mobileNumber },
      });
      if (existing) {
        throw new ConflictException('This mobile number is already in use');
      }
    }

    if (data.email && data.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictException('This email is already in use');
      }
    }

    if (data.mobileNumber) user.mobileNumber = data.mobileNumber;
    if (data.email) user.email = data.email;
    if (data.fullName) user.fullName = data.fullName;

    return this.userRepository.save(user);
  }

  private async generateMemberId(queryRunner: any): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2);

    const result = await queryRunner.manager
      .createQueryBuilder()
      .select('MAX(user.memberId)', 'maxId')
      .from(User, 'user')
      .where('user.memberId ~ :pattern', {
        pattern: `^ATB-${currentYear}-ME-[0-9]{2}$`,
      })
      .getRawOne();

    let sequentialNumber = 1;

    if (result?.maxId) {
      const parts = result.maxId.split('-');
      if (parts.length === 4) {
        const lastNumber = parseInt(parts[3], 10);
        if (!isNaN(lastNumber)) {
          sequentialNumber = lastNumber + 1;
        }
      }
    }

    return `ATB-${currentYear}-ME-${String(sequentialNumber).padStart(2, '0')}`;
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${password}@1`;
  }
}
