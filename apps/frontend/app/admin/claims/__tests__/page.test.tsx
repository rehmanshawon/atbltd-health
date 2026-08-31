import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminClaimsPage from '../page';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

const claim = {
  id: 'claim-1',
  memberId: 'member-1',
  surgeryType: 'Cardiac surgery',
  hospitalName: 'ATB Hospital',
  admissionDate: '2026-08-01',
  claimedAmount: 10000,
  approvedAmount: null,
  status: 'submitted',
  rejectionReason: null,
  notes: null,
  documents: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  member: { memberId: 'ATB-001', fullName: 'Test Member', mobileNumber: '01700000000' },
};

describe('AdminClaimsPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/documents')) {
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      if (init?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...claim, status: 'approved' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ claims: [claim], total: 1, totalPages: 1 }),
      } as Response);
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('submits an approval with the selected amount', async () => {
    render(<AdminClaimsPage />);

    await waitFor(() => expect(screen.getByText('Cardiac surgery')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /review/i }));

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[1], {
      target: { value: 'approved' },
    });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '8500' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/claims/claim-1/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'approved', approvedAmount: 8500 }),
        }),
      );
    });
    expect(await screen.findByText('Application approved successfully')).toBeInTheDocument();
  });
});
