import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CommissionsPage from '../page';
import { useAuth } from '../../../lib/auth-context';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../components/AdminTable', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <table>
      <tbody>{children}</tbody>
    </table>
  ),
}));

const mockCommissions = [
  {
    id: 'commission-1',
    agentCode: 'ATB-26-AG-1',
    memberCode: 'ATB-26-ME-01',
    commissionType: 'member_registration',
    registrationAmount: 1000,
    commissionRate: 10,
    commissionAmount: 100,
    status: 'pending',
    createdAt: '2026-08-15T00:00:00.000Z',
    agent: { user: { fullName: 'Sample Agent' } },
    member: { fullName: 'Sample Member', memberId: 'ATB-26-ME-01' },
  },
];

const mockToken = 'test-token';
const mockSuperAdmin = {
  memberId: 'ATB-26-SA-1',
  fullName: 'System Administrator',
  role: 'super_admin',
  isActive: true,
};

describe('CommissionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: mockToken,
      user: mockSuperAdmin,
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn(),
      login: jest.fn(),
      memberLogin: jest.fn(),
    });
  });

  it('renders commissions and shows table data', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        commissions: mockCommissions,
        total: 1,
        totalPages: 1,
      }),
    });

    render(<CommissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('ATB-26-AG-1')).toBeInTheDocument();
    });

    expect(screen.getByText('ATB-26-ME-01')).toBeInTheDocument();
  });

  it('calls approve endpoint when Approve button clicked', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        commissions: mockCommissions,
        total: 1,
        totalPages: 1,
      }),
    });

    (global as any).fetch = fetchMock;

    render(<CommissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    // Set up fetch mock for the approve call
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    await userEvent.click(screen.getByText('Approve'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/commissions/commission-1/approve'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows Decline button only for super_admin', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        commissions: mockCommissions,
        total: 1,
        totalPages: 1,
      }),
    });

    render(<CommissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });
  });

  it('hides Decline button for admin', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: mockToken,
      user: { ...mockSuperAdmin, role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn(),
      login: jest.fn(),
      memberLogin: jest.fn(),
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        commissions: mockCommissions,
        total: 1,
        totalPages: 1,
      }),
    });

    render(<CommissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    expect(screen.queryByText('Decline')).not.toBeInTheDocument();
  });
});
