import { SmsService } from './sms.service';

describe('SmsService', () => {
  const fetchMock = jest.fn();
  let service: SmsService;

  beforeEach(() => {
    global.fetch = fetchMock;
    service = new SmsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
