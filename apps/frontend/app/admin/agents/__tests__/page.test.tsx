import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AgentsPage from '../page';
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

const mockAgents = [
  {
    id: 'agent-1',
    agentCode: 'ATB-26-AG-1',
    commissionRate: 10,
    totalCommissionEarned: 500,
    totalMembersRegistered: 3,
    isActive: true,
    user: {
      fullName: 'Sample Agent',
      mobileNumber: '01710000001',
      memberId: 'ATB-26-AG-1',
      role: 'agent',
    },
    parentAgent: {
      id: 'owner-1',
      agentCode: 'ATB-26-OW-1',
      user: { fullName: 'Test Owner' },
    },
    members: [
      {
        id: 'member-1',
        memberId: 'ATB-26-ME-01',
        fullName: 'Sample Member',
        mobileNumber: '01710000002',
        isActive: true,
        createdAt: '2026-08-15',
      },
    ],
  },
  {
    id: 'agent-2',
    agentCode: 'ATB-26-AG-2',
    commissionRate: 10,
    totalCommissionEarned: 200,
    totalMembersRegistered: 1,
    isActive: true,
    user: {
      fullName: 'Second Agent',
      mobileNumber: '01710000003',
      memberId: 'ATB-26-AG-2',
      role: 'agent',
    },
    parentAgent: null,
    members: [],
  },
];

const mockToken = 'test-token';

function setupAuth(role = 'admin') {
  (useAuth as jest.Mock).mockReturnValue({
    token: mockToken,
    user: {
      memberId: `ATB-26-${role === 'super_admin' ? 'SA' : 'AD'}-1`,
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

describe('AgentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuth('admin');
  });

  it('renders agents list with stats', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockAgents),
    });

    render(<AgentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getByText('ATB-26-AG-1')).toBeInTheDocument();
      expect(screen.getByText('Sample Agent')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Agents')).toBeInTheDocument();
    expect(screen.getByText('Total Members')).toBeInTheDocument();
    expect(screen.getByText('Total Commission Earned')).toBeInTheDocument();
  });

  it('shows empty state when no agents', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<AgentsPage />);

    await waitFor(() => {
      expect(screen.getByText('No agents found')).toBeInTheDocument();
    });
  });

  it('expands to show member list when chevron clicked', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockAgents),
    });

    render(<AgentsPage />);

    await waitFor(() => {
      expect(screen.getByText('ATB-26-AG-1')).toBeInTheDocument();
    });

    // Find the chevron button and click it
    const chevronButton = screen.getAllByRole('button')[0];
    await userEvent.click(chevronButton);

    await waitFor(() => {
      expect(screen.getByText('ATB-26-ME-01')).toBeInTheDocument();
      expect(screen.getByText('Sample Member')).toBeInTheDocument();
    });
  });

  it('shows Create Agent link', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<AgentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Agent')).toBeInTheDocument();
    });
  });
});
