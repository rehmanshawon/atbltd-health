import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommissionsPage from '../page';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'test-token', user: { role: 'super_admin' } }),
}));

const commission = {
  id: 'commission-1',
  agentCode: 'ATB-AG-001',
  memberCode: 'ATB-001',
  commissionType: 'registration',
  registrationAmount: 1000,
  commissionRate: 10,
  commissionAmount: 100,
  status: 'pending',
  createdAt: '2026-08-01T00:00:00.000Z',
  agent: { user: { fullName: 'Agent One' } },
  member: { fullName: 'Test Member', memberId: 'ATB-001' },
};

describe('CommissionsPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders the commissions table and summary stats', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ commissions: [commission], total: 1, totalPages: 1 }),
    } as Response) as jest.Mock;

    render(<CommissionsPage />);

    await waitFor(() => expect(screen.getByText('ATB-AG-001')).toBeInTheDocument());
    expect(screen.getAllByText('100 BDT').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
  });

  it('approves a pending commission and reloads the list', async () => {
    const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/approve')) {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ commissions: [commission], total: 1, totalPages: 1 }),
      } as Response);
    });
    global.fetch = fetchMock as unknown as jest.Mock;

    render(<CommissionsPage />);

    await waitFor(() => expect(screen.getByText('ATB-AG-001')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/commissions/commission-1/approve'),
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(await screen.findByText('Commission approved')).toBeInTheDocument();
  });

  it('shows an error message when confirming payment fails', async () => {
    const approvedCommission = { ...commission, status: 'approved' };
    const fetchMock = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/confirm-payment')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'Payment already reversed' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ commissions: [approvedCommission], total: 1, totalPages: 1 }),
      } as Response);
    });
    global.fetch = fetchMock as unknown as jest.Mock;

    render(<CommissionsPage />);

    await waitFor(() => expect(screen.getByText('ATB-AG-001')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /confirm payment/i }));

    expect(await screen.findByText('Payment already reversed')).toBeInTheDocument();
  });
});
