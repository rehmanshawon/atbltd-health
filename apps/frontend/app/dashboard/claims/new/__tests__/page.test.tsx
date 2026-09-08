import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NewClaimPage from '../page';
import { useAuth } from '../../../../lib/auth-context';

jest.mock('../../../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockSurgeries = [
  { id: 'surgery-1', nameEn: 'Dengue Fever', nameBn: 'ডেঙ্গু', category: 'General' },
  { id: 'surgery-2', nameEn: 'Appendectomy', nameBn: 'অ্যাপেন্ডেকটমি', category: 'Surgery' },
];

const mockHospitals = [
  { id: 'hospital-1', name: 'Square Hospital', address: 'Dhaka' },
  { id: 'hospital-2', name: 'DMCH', address: 'Dhaka' },
];

describe('NewClaimPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: { memberId: 'ATB-26-ME-01', fullName: 'Sample Member', role: 'member', isActive: true },
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn(),
      login: jest.fn(),
      memberLogin: jest.fn(),
    });
  });

  it('renders form with dropdowns loaded from API', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockSurgeries),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockHospitals),
      });

    render(<NewClaimPage />);

    await waitFor(() => {
      expect(screen.getByText('Surgery Type *')).toBeInTheDocument();
    });

    expect(screen.getByText('Surgery Type *')).toBeInTheDocument();
    expect(screen.getByText('Hospital Name *')).toBeInTheDocument();
    expect(screen.getByText('Admission Date *')).toBeInTheDocument();
    expect(screen.getByText('Claimed Amount (BDT) *')).toBeInTheDocument();
  });

  it('shows loading state while fetching dropdowns', () => {
    (global as any).fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    render(<NewClaimPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('submits form with correct payload', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockSurgeries),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockHospitals),
      });

    (global as any).fetch = fetchMock;

    const { container } = render(<NewClaimPage />);

    await waitFor(() => {
      expect(screen.getByText('Surgery Type *')).toBeInTheDocument();
    });

    const [surgerySelect, hospitalSelect] = screen.getAllByRole('combobox');
    await userEvent.selectOptions(surgerySelect, 'surgery-1');
    await userEvent.selectOptions(hospitalSelect, 'hospital-1');

    const admissionDateInput = container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    await userEvent.type(admissionDateInput, '2026-09-08');

    const doctorInput = screen.getByPlaceholderText('e.g., Dr. Rahman');
    const amountInput = screen.getByPlaceholderText('e.g., 5000');

    await userEvent.type(doctorInput, 'Dr. Rahman');
    await userEvent.type(amountInput, '5000');
    // Submit
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    await userEvent.click(screen.getByText('Submit Application'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/claims'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
