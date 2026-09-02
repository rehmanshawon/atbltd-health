import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PaymentsPage from '../page';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

const getPaymentsMock = jest.fn();

jest.mock('../../../lib/api', () => ({
  adminApi: {
    getPayments: (...args: unknown[]) => getPaymentsMock(...args),
  },
}));

const payment = {
  id: 'payment-1',
  amount: 1000,
  method: 'bkash',
  transactionId: 'TXN123',
  status: 'pending',
  paymentType: 'membership_fee',
  createdAt: '2026-08-01T00:00:00.000Z',
  user: { memberId: 'ATB-001', fullName: 'Jane Doe' },
};

describe('PaymentsPage', () => {
  beforeEach(() => {
    getPaymentsMock.mockReset();
  });

  it('renders payments returned by the API', async () => {
    getPaymentsMock.mockResolvedValueOnce({ payments: [payment], total: 1, totalPages: 1 });

    render(<PaymentsPage />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('1,000 BDT')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('shows an empty state when there are no payments', async () => {
    getPaymentsMock.mockResolvedValueOnce({ payments: [], total: 0, totalPages: 1 });

    render(<PaymentsPage />);

    expect(await screen.findByText('No payments found')).toBeInTheDocument();
  });

  it('reloads payments when the status filter changes', async () => {
    getPaymentsMock.mockResolvedValue({ payments: [payment], total: 1, totalPages: 1 });

    render(<PaymentsPage />);
    await screen.findByText('Jane Doe');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'verified' } });

    await waitFor(() => expect(getPaymentsMock).toHaveBeenCalledWith('test-token', 'verified', 1));
  });
});
