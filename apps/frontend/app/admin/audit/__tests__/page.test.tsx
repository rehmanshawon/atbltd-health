import { render, screen } from '@testing-library/react';
import AuditPage from '../page';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

const log = {
  id: 'log-1',
  action: 'USER_REGISTERED',
  entity: 'User',
  entityId: 'user-1',
  newValue: { memberId: 'ATB-001' },
  oldValue: null,
  ipAddress: '127.0.0.1',
  createdAt: '2026-08-01T00:00:00.000Z',
  performedBy: { memberId: 'ATB-001', fullName: 'Jane Doe' },
};

describe('AuditPage', () => {
  it('renders audit log entries returned by the API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ logs: [log], total: 1, totalPages: 1 }),
    } as Response);

    render(<AuditPage />);

    expect(await screen.findByText('USER REGISTERED')).toBeInTheDocument();
    expect(screen.getByText(/1 entries/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no audit logs', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ logs: [], total: 0, totalPages: 1 }),
    } as Response);

    render(<AuditPage />);

    expect(await screen.findByText(/0 entries/)).toBeInTheDocument();
  });
});
