import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import OwnersPage from '../page';
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

const mockOwners = [
  {
    id: 'owner-1',
    agentCode: 'ATB-26-OW-1',
    commissionRate: 5,
    totalCommissionEarned: 1500,
    totalMembersRegistered: 5,
    isActive: true,
    user: {
      fullName: 'A.K.M. Moshiur Rahman',
      mobileNumber: '01711993597',
      memberId: 'ATB-26-OW-1',
    },
    subAgents: [
      {
        id: 'agent-1',
        agentCode: 'ATB-26-AG-1',
        commissionRate: 10,
        totalCommissionEarned: 500,
        totalMembersRegistered: 3,
        isActive: true,
        user: { fullName: 'Sample Agent', mobileNumber: '01710000001' },
      },
    ],
    createdBy: 'ATB-26-SA-1',
    createdByName: 'System Administrator',
  },
];

describe('OwnersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: {
        memberId: 'ATB-26-SA-1',
        fullName: 'System Administrator',
        role: 'super_admin',
        isActive: true,
      },
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn(),
      login: jest.fn(),
      memberLogin: jest.fn(),
    });
  });

  it('renders owners list with stats', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockOwners),
    });

    render(<OwnersPage />);

    await waitFor(() => {
      expect(screen.getByText('Owners')).toBeInTheDocument();
      expect(screen.getByText('ATB-26-OW-1')).toBeInTheDocument();
      expect(screen.getByText('A.K.M. Moshiur Rahman')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Owners')).toBeInTheDocument();
    expect(screen.getByText('Total Sub-Agents')).toBeInTheDocument();
  });

  it('shows Created By info', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockOwners),
    });

    render(<OwnersPage />);

    await waitFor(() => {
      expect(screen.getByText('System Administrator')).toBeInTheDocument();
      expect(screen.getByText('ATB-26-SA-1')).toBeInTheDocument();
    });
  });

  it('expands to show sub-agents', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockOwners),
    });

    render(<OwnersPage />);

    await waitFor(() => {
      expect(screen.getByText('ATB-26-OW-1')).toBeInTheDocument();
    });

    const chevronButton = screen.getAllByRole('button')[0];
    await userEvent.click(chevronButton);

    await waitFor(() => {
      expect(screen.getByText('ATB-26-AG-1')).toBeInTheDocument();
    });
  });

  it('shows Create Owner link', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<OwnersPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Owner')).toBeInTheDocument();
    });
  });
});
