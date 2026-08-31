import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    service = new OtpService();
  });

  it('rejects a mismatched member OTP without consuming it', () => {
    service.issueMemberOtp('01712345678');

    expect(() => service.verifyMemberOtp('01712345678', '000000')).toThrow(BadRequestException);
    expect(() => service.verifyMemberOtp('01712345678', '123456')).not.toThrow();
  });

  it('rejects and removes an expired staff OTP', () => {
    jest.useFakeTimers();
    service.issueStaffOtp('staff-1');
    jest.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(() => service.verifyStaffOtp('staff-1', '123456')).toThrow('OTP expired');
    expect(() => service.verifyStaffOtp('staff-1', '123456')).toThrow('OTP not sent or expired');

    jest.useRealTimers();
  });
});
