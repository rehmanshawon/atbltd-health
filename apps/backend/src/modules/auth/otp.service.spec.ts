import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SmsService } from '../sms/sms.service';

describe('OtpService', () => {
  let service: OtpService;
  let mockSmsService: Partial<SmsService>;

  beforeEach(() => {
    mockSmsService = {
      sendSms: jest.fn().mockResolvedValue({ success: true }),
    };
    service = new OtpService(mockSmsService as SmsService);
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

  it('sends member OTP via SMS service', async () => {
    const result = await service.sendMemberOtp('01712345678');
    expect(result.success).toBe(true);
    expect(mockSmsService.sendSms).toHaveBeenCalled();
  });

  it('sends staff OTP via SMS service when mobile is provided', async () => {
    const result = await service.sendStaffOtp('staff-1', '01712345678');
    expect(result.success).toBe(true);
    expect(mockSmsService.sendSms).toHaveBeenCalled();
  });

  it('works safely without SMS service injected', async () => {
    const standaloneService = new OtpService();
    const result = await standaloneService.sendMemberOtp('01712345678');
    expect(result.success).toBe(true);
  });
});
