import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ApprovalsPage from '../page';
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

const mockPendingCreates = [
  {
    id: 'agent-1',
    agentCode: 'ATB-26-AG-3',
    approvalStatus: 'pending',
    isActive: false,
    user: {
      fullName: 'New Agent',
      mobileNumber: '01710000004',
      memberId: 'ATB-26-AG-3',
      role: 'agent',
    },
    parentAgent: { agentCode: 'ATB-26-OW-1' },
  },
];

const mockPendingDeactivations = [
  {
    id: 'agent-2',
    agentCode: 'ATB-26-AG-1',
    approvalStatus: 'deactivation_pending',
    isActive: true,
    user: {
      fullName: 'Sample Agent',
      mobileNumber: '01710000001',
      memberId: 'ATB-26-AG-1',
      role: 'agent',
    },
  },
];

function setupAuth(role: 'super_admin' | 'admin') {
  (useAuth as jest.Mock).mockReturnValue({
    token: 'test-token',
    user: {
      memberId: role === 'super_admin' ? 'ATB-26-SA-1' : 'ATB-26-AD-1',
      fullName: role === 'super_admin' ? 'System Administrator' : 'Finance Director',
      role,
      isActive: true,
    },
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
    login: jest.fn(),
    memberLogin: jest.fn(),
  });
}

describe('ApprovalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Final Approvals" for super_admin', async () => {
    setupAuth('super_admin');
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        pendingCreates: mockPendingCreates,
        pendingDeactivations: mockPendingDeactivations,
      }),
    });

    render(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Final Approvals')).toBeInTheDocument();
    });
  });

  it('shows "Pending Checks" for admin', async () => {
    setupAuth('admin');
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        pendingCreates: mockPendingCreates,
        pendingDeactivations: [],
      }),
    });

    render(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending Checks')).toBeInTheDocument();
    });
  });

  it('renders pending creations with approve button', async () => {
    setupAuth('admin');
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        pendingCreates: mockPendingCreates,
        pendingDeactivations: [],
      }),
    });

    render(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Agent')).toBeInTheDocument();
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
  });

  it('shows Decline button for super_admin only', async () => {
    setupAuth('super_admin');
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        pendingCreates: mockPendingCreates,
        pendingDeactivations: [],
      }),
    });

    render(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });
  });

  it('hides Decline button for admin', async () => {
    setupAuth('admin');
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        pendingCreates: mockPendingCreates,
        pendingDeactivations: [],
      }),
    });

    render(<ApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    expect(screen.queryByText('Decline')).not.toBeInTheDocument();
  });
});
