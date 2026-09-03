import { apiCall, authApi, adminApi } from '../api';

const mockFetch = jest.fn();

beforeEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
});

describe('apiCall', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('serializes JSON requests and adds a bearer token', async () => {
    const response = { ok: true, status: 200, json: jest.fn().mockResolvedValue({ id: '1' }) };
    mockFetch.mockResolvedValue(response as unknown as Response);

    await expect(
      apiCall('/claims', {
        method: 'POST',
        body: { claimedAmount: 1000 },
        token: 'jwt-token',
      }),
    ).resolves.toEqual({ id: '1' });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/claims'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-token',
      },
      body: JSON.stringify({ claimedAmount: 1000 }),
    });
  });

  it('omits a request body when no body is provided', async () => {
    const response = { ok: true, status: 200, json: jest.fn().mockResolvedValue([]) };
    mockFetch.mockResolvedValue(response as unknown as Response);

    await apiCall('/admin/dashboard');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/dashboard'),
      expect.objectContaining({ method: 'GET', body: undefined }),
    );
  });

  it('throws the API message when the server rejects a request', async () => {
    const response = {
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({ message: 'Claim amount is invalid' }),
    };
    mockFetch.mockResolvedValue(response as unknown as Response);

    await expect(apiCall('/claims', { token: 'jwt-token' })).rejects.toThrow(
      'Claim amount is invalid',
    );
  });

  it('falls back to the HTTP status when the API has no message', async () => {
    const response = { ok: false, status: 503, json: jest.fn().mockResolvedValue({}) };
    mockFetch.mockResolvedValue(response as unknown as Response);

    await expect(apiCall('/claims')).rejects.toThrow('Request failed with status 503');
  });
});

describe('API endpoint wrappers', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);
  });

  it('maps login credentials to the public login endpoint', async () => {
    await authApi.login({ identifier: 'ATB-26-SA-1', password: 'secret' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ identifier: 'ATB-26-SA-1', password: 'secret' }),
      }),
    );
  });

  it('maps payment verification to the admin endpoint with the token', async () => {
    await adminApi.verifyPayment('payment-1', 'jwt-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/payments/payment-1/verify'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    );
  });
});
