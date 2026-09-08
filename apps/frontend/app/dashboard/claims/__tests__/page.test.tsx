import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberClaimsPage from '../page';
import { useAuth } from '../../../lib/auth-context';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockClaims = [
  {
    id: 'claim-1',
    surgeryType: 'Dengue Fever',
    hospitalName: 'Square Hospital',
    claimedAmount: 5000,
    approvedAmount: null,
    status: 'submitted',
    rejectionReason: null,
    createdAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'claim-2',
    surgeryType: 'Appendectomy',
    hospitalName: 'DMCH',
    claimedAmount: 8000,
    approvedAmount: 8000,
    status: 'approved',
    rejectionReason: null,
    createdAt: '2026-08-16T00:00:00.000Z',
  },
];

describe('MemberClaimsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: {
        memberId: 'ATB-26-ME-01',
        fullName: 'Sample Member',
        role: 'member',
        isActive: true,
      },
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn(),
      login: jest.fn(),
      memberLogin: jest.fn(),
    });
  });

  it('renders claims list with status labels', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockClaims),
    });

    render(<MemberClaimsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Claims')).toBeInTheDocument();
      expect(screen.getByText('Dengue Fever')).toBeInTheDocument();
      expect(screen.getByText('Square Hospital')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
  });

  it('shows empty state when no claims', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<MemberClaimsPage />);

    await waitFor(() => {
      expect(screen.getByText('No claims yet')).toBeInTheDocument();
    });
  });

  it('shows New Benefit Application button', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<MemberClaimsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Benefit Application')).toBeInTheDocument();
    });
  });

  it('shows approval amount for approved claims', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([mockClaims[1]]),
    });

    render(<MemberClaimsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Approved: 8,000 BDT/)).toBeInTheDocument();
    });
  });
});
