import { BadRequestException, Injectable } from '@nestjs/common';

type StoredOtp = { otp: string; expiresAt: Date };

@Injectable()
export class OtpService {
  private readonly memberOtps = new Map<string, StoredOtp>();
  private readonly staffOtps = new Map<string, StoredOtp>();

  issueMemberOtp(mobileNumber: string): string {
    const otp = this.generateOtp();
    this.memberOtps.set(mobileNumber, this.createStoredOtp(otp));
    return otp;
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
    return otp;
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
