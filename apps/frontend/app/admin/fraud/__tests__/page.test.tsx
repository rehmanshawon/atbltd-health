import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FraudPage from '../page';
import { useAuth } from '../../../lib/auth-context';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockAlerts = [
  {
    type: 'duplicate_nid',
    severity: 'high',
    message: 'NID 1234567890 is associated with 2 accounts',
    details: {
      nid: '1234567890',
      users: [
        {
          id: 'user-1',
          fullName: 'Test Member',
          memberId: 'ATB-26-ME-01',
          mobileNumber: '01712345678',
        },
      ],
    },
  },
  {
    type: 'rapid_registrations',
    severity: 'medium',
    message: '6 registrations from IP 192.168.1.1',
    details: { ip: '192.168.1.1', count: 6 },
  },
];

describe('FraudPage', () => {
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

  it('renders fraud alerts with severity summary', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockAlerts),
    });

    render(<FraudPage />);

    await waitFor(() => {
      expect(screen.getByText('Fraud Detection')).toBeInTheDocument();
      expect(screen.getByText('Total Alerts')).toBeInTheDocument();
      expect(screen.getByText('High Severity')).toBeInTheDocument();
      expect(screen.getByText('Medium Severity')).toBeInTheDocument();
      expect(screen.getByText('Duplicate NID')).toBeInTheDocument();
    });

    expect(screen.getByText('Rapid Registrations')).toBeInTheDocument();
  });

  it('shows empty state when no alerts', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<FraudPage />);

    await waitFor(() => {
      expect(screen.getByText('No issues detected')).toBeInTheDocument();
    });
  });

  it('shows alert details', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockAlerts),
    });

    render(<FraudPage />);

    await waitFor(() => {
      expect(screen.getByText(/NID 1234567890/)).toBeInTheDocument();
      expect(screen.getByText(/Test Member/)).toBeInTheDocument();
    });
  });

  it('shows Run Checks button', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<FraudPage />);

    await waitFor(() => {
      expect(screen.getByText('Run Checks')).toBeInTheDocument();
    });
  });
});
