import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HospitalDashboard from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('../../../lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const mockClaims = [
  {
    id: 'claim-1',
    surgeryType: 'Appendectomy',
    hospitalName: 'Square Hospital',
    claimedAmount: 8000,
    status: 'hospital_verification',
    createdAt: '2026-08-15T00:00:00.000Z',
    member: {
      fullName: 'Sample Member',
      memberId: 'ATB-26-ME-01',
      mobileNumber: '01710000002',
    },
  },
];

function setupHospitalAuth() {
  localStorage.setItem('hospital_token', 'hospital-token');
  localStorage.setItem(
    'hospital_data',
    JSON.stringify({ id: 'hospital-1', name: 'Square Hospital' }),
  );
}

describe('HospitalDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setupHospitalAuth();
  });

  it('renders hospital name and claims list', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockClaims),
    });

    render(<HospitalDashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('Square Hospital').length).toBeGreaterThan(0);
      expect(screen.getByText('Appendectomy')).toBeInTheDocument();
    });

    expect(screen.getByText('Applications for Verification')).toBeInTheDocument();
  });

  it('shows Verify and Reject buttons', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockClaims),
    });

    render(<HospitalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Verify')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
  });

  it('shows member details', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockClaims),
    });

    render(<HospitalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Sample Member')).toBeInTheDocument();
      expect(screen.getByText('ATB-26-ME-01')).toBeInTheDocument();
    });
  });

  it('shows empty state when no claims', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<HospitalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No applications to verify')).toBeInTheDocument();
    });
  });
});
