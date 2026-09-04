import { BadRequestException, Injectable, Logger, Optional } from '@nestjs/common';
import { SmsService } from '../sms/sms.service';

type StoredOtp = { otp: string; expiresAt: Date };

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly memberOtps = new Map<string, StoredOtp>();
  private readonly staffOtps = new Map<string, StoredOtp>();

  constructor(@Optional() private readonly smsService?: SmsService) {}

  issueMemberOtp(mobileNumber: string): string {
    const otp = this.generateOtp();
    this.memberOtps.set(mobileNumber, this.createStoredOtp(otp));
    this.logger.log(`[DEV] Member OTP for ${mobileNumber}: ${otp}`);
    return otp;
  }

  async sendMemberOtp(mobileNumber: string): Promise<{ success: boolean; message: string }> {
    const otp = this.issueMemberOtp(mobileNumber);

    if (this.smsService) {
      try {
        await this.smsService.sendSms(
          mobileNumber,
          `ATB Ltd: Your verification OTP is ${otp}. Valid for 5 minutes.`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to send SMS to ${mobileNumber}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    return {
      success: true,
      message: 'OTP sent successfully. Valid for 5 minutes.',
    };
  }

  verifyMemberOtp(mobileNumber: string, otp: string): void {
    this.verifyOtp(
      this.memberOtps,
      mobileNumber,
      otp,
      'No OTP was sent or OTP has expired. Please request a new one.',
      'OTP has expired. Please request a new one.',
      'Invalid OTP. Please try again.',
    );
  }

  issueStaffOtp(staffId: string): string {
    const otp = this.generateOtp();
    this.staffOtps.set(staffId, this.createStoredOtp(otp));
    this.logger.log(`[DEV] Staff OTP for ${staffId}: ${otp}`);
    return otp;
  }

  async sendStaffOtp(
    staffId: string,
    mobileNumber?: string,
  ): Promise<{ success: boolean; message: string }> {
    const otp = this.issueStaffOtp(staffId);

    if (mobileNumber && this.smsService) {
      try {
        await this.smsService.sendSms(
          mobileNumber,
          `ATB Ltd: Your login OTP is ${otp}. Valid for 5 minutes.`,
        );
        this.logger.log(`Staff OTP sent to ${mobileNumber}`);
      } catch (error) {
        this.logger.error(
          `Failed to send staff OTP SMS: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    return { success: true, message: 'OTP sent to your mobile number' };
  }

  verifyStaffOtp(staffId: string, otp: string): void {
    this.verifyOtp(
      this.staffOtps,
      staffId,
      otp,
      'OTP not sent or expired',
      'OTP expired',
      'Invalid OTP',
    );
  }

  private createStoredOtp(otp: string): StoredOtp {
    return { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) };
  }

  private generateOtp(): string {
    return process.env.NODE_ENV === 'production'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';
  }

  private verifyOtp(
    store: Map<string, StoredOtp>,
    subject: string,
    otp: string,
    notFoundMessage: string,
    expiredMessage: string,
    invalidMessage: string,
  ): void {
    const storedOtp = store.get(subject);

    if (!storedOtp) {
      throw new BadRequestException(notFoundMessage);
    }

    if (new Date() > storedOtp.expiresAt) {
      store.delete(subject);
      throw new BadRequestException(expiredMessage);
    }

    if (storedOtp.otp !== otp) {
      throw new BadRequestException(invalidMessage);
    }

    store.delete(subject);
  }
}
