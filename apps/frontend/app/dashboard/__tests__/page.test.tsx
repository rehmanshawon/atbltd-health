import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MemberDashboard from '../page';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { role: 'member' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

const getDashboardMock = jest.fn();

jest.mock('../../lib/api', () => ({
  membershipApi: {
    getDashboard: (...args: unknown[]) => getDashboardMock(...args),
  },
}));

const dashboardData = {
  profile: {
    memberId: 'ATB-001',
    fullName: 'Jane Doe',
    mobileNumber: '01700000000',
    email: null,
    nid: null,
    isActive: true,
    isKycVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  membership: {
    membershipFee: 1000,
    isPaymentVerified: true,
    membershipStartDate: '2026-01-01',
    membershipEndDate: '2027-01-01',
    isActive: true,
    remainingBenefit: 8000,
    renewalFee: 850,
  },
  digitalCard: {
    memberId: 'ATB-001',
    fullName: 'Jane Doe',
    membershipType: 'Annual Membership',
    validUntil: '2027-01-01',
    remainingBenefit: 8000,
    isActive: true,
  },
};

describe('MemberDashboard', () => {
  beforeEach(() => {
    getDashboardMock.mockReset();
    replaceMock.mockReset();
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
  });

  it('renders the member dashboard once data loads', async () => {
    getDashboardMock.mockResolvedValueOnce(dashboardData);

    render(<MemberDashboard />);

    expect(await screen.findByText('Welcome, Jane')).toBeInTheDocument();
    expect(screen.getByText('ATB-001')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('copies the member ID to the clipboard', async () => {
    getDashboardMock.mockResolvedValueOnce(dashboardData);

    render(<MemberDashboard />);
    await screen.findByText('Welcome, Jane');

    fireEvent.click(screen.getByRole('button', { name: '' }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ATB-001'));
  });

  it('shows a pending badge when the membership is not yet active', async () => {
    getDashboardMock.mockResolvedValueOnce({
      ...dashboardData,
      membership: { ...dashboardData.membership, isActive: false },
    });

    render(<MemberDashboard />);

    expect(await screen.findByText('Pending')).toBeInTheDocument();
  });
});
