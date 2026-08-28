import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Agent } from '../../entities/agent.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
@Injectable()
export class AuthService {
  // In production, store OTPs in Redis with TTL. This in-memory map is for development.
  private otpStore: Map<string, { otp: string; expiresAt: Date }> = new Map();

  // Official ATB recipient accounts for payment routing validation
  private getOfficialAccounts() {
    return {
      bkash: process.env.BKASH_MERCHANT_NUMBER || '01XXXXXXXXX',
      nagad: process.env.NAGAD_MERCHANT_NUMBER || '01XXXXXXXXX',
      rocket: process.env.ROCKET_MERCHANT_NUMBER || '01XXXXXXXXX',
      bank: process.env.BANK_ACCOUNT || 'ATB-OFFICIAL-BANK-ACCOUNT',
    };
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
  ) {}

  /**
   * Step 1: Register a new member with payment information.
   * This replaces the mock modal in your frontend.
   * Flow: Validate → Check duplicates → Create user + membership + payment record → Return success
   */
  async register(registerDto: RegisterDto): Promise<{
    success: boolean;
    message: string;
    memberId?: string;
    temporaryPassword?: string;
  }> {
    // ---- VALIDATION: Check for duplicate NID and mobile ----
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
      throw new ConflictException(
        'A member with this mobile number already exists',
      );
    }

    // ---- VALIDATION: Payment routing ----
    // Per meeting agenda: "No payment shall go to any Agent's personal account"
    // In production, verify the transactionId with the payment gateway API
    const officialAccounts = this.getOfficialAccounts();
    const recipientAccount = officialAccounts[registerDto.paymentMethod];
    if (!recipientAccount) {
      throw new BadRequestException(
        `Invalid payment method: ${registerDto.paymentMethod}. Allowed: bkash, nagad, rocket, bank`,
      );
    }

    // ---- TRANSACTION: Create user, membership, and payment in one atomic operation ----
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Generate Member ID: ATB-YYYY-XXXXXX
      const memberId = await this.generateMemberId(queryRunner);

      // 2. Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      // 3. Create User
      const user = this.userRepository.create({
        memberId,
        fullName: registerDto.fullName,
        fatherName: registerDto.fatherName,
        motherName: registerDto.motherName,
        dateOfBirth: registerDto.dateOfBirth
          ? new Date(registerDto.dateOfBirth)
          : null,
        nid: registerDto.nid,
        mobileNumber: registerDto.mobileNumber,
        email: registerDto.email,
        permanentAddress: registerDto.permanentAddress,
        currentAddress: registerDto.currentAddress,
        // emergencyContact: registerDto.emergencyContact,
        password: hashedPassword,
        role: UserRole.MEMBER,
        referralId: registerDto.referralId,
        isActive: false, // Will be activated after payment verification
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

      // 4. Create Membership record
      const membership = this.membershipRepository.create({
        userId: savedUser.id,
        membershipFee: 1000.0,
        isPaymentVerified: false,
        paymentMethod: registerDto.paymentMethod,
        //transactionId: registerDto.transactionId,
        isActive: false,
        remainingBenefit: 12000.0,
        renewalFee: 850.0,
      });

      const savedMembership = await queryRunner.manager.save(membership);

      // 5. Create Payment record (pending verification)
      const payment = this.paymentRepository.create({
        userId: savedUser.id,
        paymentType: PaymentType.MEMBERSHIP_FEE,
        amount: 1000.0,
        method: registerDto.paymentMethod,
        //transactionId: registerDto.transactionId,
        senderAccount: registerDto.senderAccount || registerDto.mobileNumber,
        recipientAccount: recipientAccount,
        status: PaymentStatus.PENDING,
      });

      await queryRunner.manager.save(payment);

      // 6. Create Audit Log
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

      // 7. If referralId is provided, link to agent (for commission tracking later)
      if (registerDto.referralId) {
        const referringAgent = await this.agentRepository.findOne({
          where: { agentCode: registerDto.referralId, isActive: true },
        });

        if (referringAgent) {
          // Increment the agent's registration count
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
        temporaryPassword, // In production, send this via SMS, never return in API response
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Registration failed: ${errorMessage}`,
      );
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

    // Normalize: uppercase for staff IDs
    const normalizedIdentifier = identifier.includes('ATB')
      ? identifier.toUpperCase()
      : identifier;

    // Try to find user by staff ID first, then by mobile number
    let user = await this.userRepository.findOne({
      where: { memberId: normalizedIdentifier },
    });

    if (!user) {
      // Try mobile number
      user = await this.userRepository.findOne({
        where: { mobileNumber: identifier },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid Staff ID or Mobile Number');
    }

    // Only staff (super_admin, admin, owner, agent) can use this login
    if (user.role === UserRole.MEMBER) {
      throw new UnauthorizedException(
        'Members must login with Member ID only. Use Member Login.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is not active. Please contact support.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Update last login
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
   * Step 3: Verify OTP (for mobile verification during registration flow)
   * In production: Integrate with an SMS gateway (Twilio, Infobip, etc.)
   * Development: Uses mock OTP "123456" as configured in your frontend
   */
  async sendOtp(
    mobileNumber: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { mobileNumber },
    });

    if (!user) {
      throw new BadRequestException(
        'No registration found for this mobile number',
      );
    }

    // Generate 6-digit OTP
    const otp =
      process.env.NODE_ENV === 'production'
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : '123456'; // Development mock OTP matching your frontend

    // Store OTP with 5-minute expiry
    this.otpStore.set(mobileNumber, {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // In production: Send OTP via SMS gateway
    // await this.smsService.send(mobileNumber, `Your ATB verification code: ${otp}`);

    console.log(`[DEV] OTP for ${mobileNumber}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully. Valid for 5 minutes.',
    };
  }

  /**
   * Verify OTP and activate the user if payment is verified
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
  }> {
    const storedOtp = this.otpStore.get(verifyOtpDto.mobileNumber);

    if (!storedOtp) {
      throw new BadRequestException(
        'No OTP was sent or OTP has expired. Please request a new one.',
      );
    }

    if (new Date() > storedOtp.expiresAt) {
      this.otpStore.delete(verifyOtpDto.mobileNumber);
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (storedOtp.otp !== verifyOtpDto.otp) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    // OTP verified - clean up
    this.otpStore.delete(verifyOtpDto.mobileNumber);

    // Find the user and activate if payment is verified
    const user = await this.userRepository.findOne({
      where: { mobileNumber: verifyOtpDto.mobileNumber },
      relations: ['membership'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate JWT token for the verified user
    const payload: JwtPayload = {
      sub: user.id,
      memberId: user.memberId,
      role: user.role,
      mobileNumber: user.mobileNumber,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'OTP verified successfully.',
      accessToken,
    };
  }

  /**
   * Generate a unique Member ID: ATB-YYYY-XXXXXX
   * Format: ATB-{current year}-{6-digit sequential number}
   */
  private async generateMemberId(queryRunner: any): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2); // "26"

    const result = await queryRunner.manager
      .createQueryBuilder()
      .select('MAX(user.memberId)', 'maxId')
      .from(User, 'user')
      .where('user.memberId ~ :pattern', {
        pattern: `^ATB-${currentYear}-ME-[0-9]{2}$`, // New pattern for ATB-26-ME-01
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
  /**
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${password}@1`; // Ensure it has a special char and number
  }

  /**
   * Admin-only: Verify a payment and activate membership
   * This implements the Maker role in Maker-Checker system
   */
  async verifyPayment(
    paymentId: string,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${payment.status}`);
    }

    // Update payment status
    payment.status = PaymentStatus.VERIFIED;
    payment.verifiedBy = adminUserId;
    payment.verifiedAt = new Date();
    await this.paymentRepository.save(payment);

    // Activate membership
    const membership = await this.membershipRepository.findOne({
      where: { userId: payment.userId },
    });

    if (membership) {
      const today = new Date();
      membership.isPaymentVerified = true;
      membership.isActive = true;
      membership.membershipStartDate = today;

      // Set end date to 12 months from now
      const endDate = new Date(today);
      endDate.setFullYear(endDate.getFullYear() + 1);
      membership.membershipEndDate = endDate;

      await this.membershipRepository.save(membership);
    }

    // Activate user
    if (payment.user) {
      payment.user.isActive = true;
      payment.user.isKycVerified = true; // Payment verified = KYC passed for now
      await this.userRepository.save(payment.user);
    }

    // Audit log
    await this.auditLogRepository.save({
      action: 'PAYMENT_VERIFIED',
      entity: 'Payment',
      entityId: paymentId,
      performedById: adminUserId,
      newValue: { status: 'verified', amount: payment.amount },
    });

    return {
      success: true,
      message: 'Payment verified and membership activated successfully.',
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['membership'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove sensitive data
    delete user.password;
    return user;
  }

  /**
   * Member login with only Member ID (no password, no mobile)
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
    // Normalize input - allow "ATB-26-01" or "26-01"
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
      throw new UnauthorizedException(
        'Your membership is not yet active. Please contact support.',
      );
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
}
