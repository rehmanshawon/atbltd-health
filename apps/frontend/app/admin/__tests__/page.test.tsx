import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../page';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';

jest.mock('../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  adminApi: {
    getDashboard: jest.fn(),
    getPendingPayments: jest.fn(),
    verifyPayment: jest.fn(),
  },
}));

jest.mock('../components/KpiCards', () => ({
  __esModule: true,
  default: () => <div>KPI Cards</div>,
}));

jest.mock('../components/ChartsSection', () => ({
  __esModule: true,
  default: () => <div>Charts Section</div>,
}));

jest.mock('../components/PendingPaymentsTable', () => ({
  __esModule: true,
  default: () => <div>Pending Payments Table</div>,
}));

jest.mock('../components/AgentDashboardCards', () => ({
  __esModule: true,
  default: () => <div>Agent Dashboard Cards</div>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

const mockStats = {
  members: { total: 100, active: 80, inactive: 20, newThisMonth: 10 },
  payments: { totalCollection: 50000, pendingVerification: 5, verifiedToday: 3 },
  claims: { submitted: 20, pending: 8, approved: 10, rejected: 2 },
  agents: { total: 15, active: 12 },
  commissions: { totalEarned: 5000, totalPaid: 3000 },
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminApi.getDashboard as jest.Mock).mockResolvedValue(mockStats);
    (adminApi.getPendingPayments as jest.Mock).mockResolvedValue([]);
  });

  it('shows full dashboard for super_admin', async () => {
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
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText("Monitor your organization's performance")).toBeInTheDocument();
    });

    expect(screen.getByText('KPI Cards')).toBeInTheDocument();
    expect(screen.getByText('Charts Section')).toBeInTheDocument();
    expect(screen.getByText('Pending Payments Table')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('shows simplified dashboard for owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: { memberId: 'ATB-26-OW-1', fullName: 'Test Owner', role: 'owner', isActive: true },
      isAuthenticated: true,
      isLoading: false,
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        members: { total: 10, active: 8 },
        agents: { total: 3 },
        commissions: { totalEarned: 500, totalPaid: 200 },
      }),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Your performance summary')).toBeInTheDocument();
      expect(screen.getByText('Agent Dashboard Cards')).toBeInTheDocument();
    });

    expect(screen.queryByText('KPI Cards')).not.toBeInTheDocument();
    expect(screen.queryByText('Charts Section')).not.toBeInTheDocument();
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('shows simplified dashboard for agent', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: { memberId: 'ATB-26-AG-1', fullName: 'Test Agent', role: 'agent', isActive: true },
      isAuthenticated: true,
      isLoading: false,
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        members: { total: 5, active: 4 },
        agents: { total: 0 },
        commissions: { totalEarned: 200, totalPaid: 100 },
      }),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Agent Dashboard Cards')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: { memberId: 'ATB-26-SA-1', role: 'super_admin', isActive: true },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<AdminDashboard />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: { memberId: 'ATB-26-SA-1', role: 'super_admin', isActive: true },
      isAuthenticated: true,
      isLoading: false,
    });

    (adminApi.getDashboard as jest.Mock).mockRejectedValue(new Error('API failed'));
    (adminApi.getPendingPayments as jest.Mock).mockRejectedValue(new Error('API failed'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });
});
