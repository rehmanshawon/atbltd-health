import { SmsService } from './sms.service';

describe('SmsService', () => {
  const fetchMock = jest.fn();
  let service: SmsService;

  beforeEach(() => {
    delete process.env.SMS_DISABLED;
    global.fetch = fetchMock;
    service = new SmsService();
  });

  afterEach(() => {
    delete process.env.SMS_DISABLED;
    jest.clearAllMocks();
  });

  it('skips the provider when SMS is disabled for an isolated environment', async () => {
    process.env.SMS_DISABLED = 'true';

    await expect(service.sendSms('01712345678', 'Membership activated')).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a formatted Bangladesh number when the provider reports success', async () => {
    fetchMock.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ status: 'SMS_SENT_SUCCESSFULLY' }),
    });

    await expect(service.sendSms('8801712345678', 'Membership activated')).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bdbulksms.net/api.php?json',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"to":"+8801712345678"'),
      }),
    );
  });

  it('returns false when the provider response has no successful status', async () => {
    fetchMock.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ status: 'FAILED' }),
    });

    await expect(service.sendSms('01712345678', 'Membership activated')).resolves.toBe(false);
  });

  it('returns false when the provider request fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));

    await expect(service.sendSms('01712345678', 'Membership activated')).resolves.toBe(false);
  });
});
