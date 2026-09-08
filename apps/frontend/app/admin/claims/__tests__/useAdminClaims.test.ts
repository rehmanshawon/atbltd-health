import { act, renderHook, waitFor } from '@testing-library/react';
import { useAdminClaims } from '../useAdminClaims';
import { useAuth } from '../../../lib/auth-context';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../lib/logger', () => ({
  logger: { error: jest.fn() },
}));

const mockToken = 'test-token';

const validClaimsResponse = {
  claims: [
    {
      id: 'claim-1',
      memberId: 'member-1',
      surgeryType: 'Dengue Fever',
      hospitalName: 'Square Hospital',
      admissionDate: '2026-08-15',
      operationDate: null,
      doctorName: null,
      claimedAmount: 5000,
      approvedAmount: null,
      status: 'submitted',
      rejectionReason: null,
      notes: null,
      documents: [],
      createdAt: '2026-08-15T00:00:00.000Z',
      member: {
        memberId: 'ATB-26-ME-01',
        fullName: 'Test Member',
        mobileNumber: '01712345678',
      },
    },
  ],
  total: 1,
  totalPages: 1,
};

describe('useAdminClaims', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: mockToken,
      user: { role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('loads claims with zod validation', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(validClaimsResponse),
    });

    const { result } = renderHook(() => useAdminClaims());
    await act(async () => {
      await result.current.loadClaims();
    });

    await waitFor(() => {
      expect(result.current.claims).toHaveLength(1);
      expect(result.current.claims[0].surgeryType).toBe('Dengue Fever');
      expect(result.current.total).toBe(1);
    });
  });

  it('handles invalid response with empty state', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ invalid: 'data' }),
    });

    const { result } = renderHook(() => useAdminClaims());

    await waitFor(() => {
      expect(result.current.claims).toEqual([]);
      expect(result.current.total).toBe(0);
    });
  });

  it('updates claim status with validated payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    (global as any).fetch = fetchMock;

    const { result } = renderHook(() => useAdminClaims());

    await result.current.updateClaimStatus('claim-1', 'approved', {
      approvedAmount: '5000',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/claims/claim-1/status'),
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"status":"approved"'),
      }),
    );
  });

  it('rejects invalid status update payload', async () => {
    const { result } = renderHook(() => useAdminClaims());

    await expect(result.current.updateClaimStatus('claim-1', 'invalid_status')).rejects.toThrow(
      /Invalid status update payload/,
    );
  });

  it('handles API error on update', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ message: 'Bad request' }),
    });

    const { result } = renderHook(() => useAdminClaims());

    await expect(
      result.current.updateClaimStatus('claim-1', 'approved', {
        approvedAmount: '5000',
      }),
    ).rejects.toThrow('Bad request');
  });
});
