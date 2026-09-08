import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HospitalsPage from '../page';
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

const mockHospitals = [
  {
    id: 'hospital-1',
    name: 'Square Hospital',
    address: 'Dhaka',
    contactNumber: '+880-2-8144400',
    loginId: 'square.hospital',
    isPartner: true,
    isActive: true,
  },
  {
    id: 'hospital-2',
    name: 'United Hospital',
    address: 'Gulshan, Dhaka',
    contactNumber: '+880-2-8836000',
    loginId: 'united.hospital',
    isPartner: true,
    isActive: false,
  },
];

describe('HospitalsPage', () => {
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

  it('renders hospital list', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockHospitals),
    });

    render(<HospitalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Hospitals')).toBeInTheDocument();
      expect(screen.getByText('Square Hospital')).toBeInTheDocument();
      expect(screen.getByText('United Hospital')).toBeInTheDocument();
    });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('toggles create form when Add Hospital clicked', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<HospitalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Hospital')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Add Hospital'));

    expect(screen.getByPlaceholderText('Hospital Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Login ID')).toBeInTheDocument();
  });

  it('shows empty state when no hospitals', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    render(<HospitalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Hospital')).toBeInTheDocument();
    });
  });
});
