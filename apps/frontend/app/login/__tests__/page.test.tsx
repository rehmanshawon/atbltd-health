import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../page';

const memberLoginMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    login: jest.fn(),
    memberLogin: memberLoginMock,
    isAuthenticated: false,
    user: null,
    isLoading: false,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    memberLoginMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('submits the entered Member ID', async () => {
    memberLoginMock.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('Enter your Member ID'), {
      target: { value: 'ATB-26-000123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(memberLoginMock).toHaveBeenCalledWith('ATB-26-000123'));
  });

  it('shows an error message when member login fails', async () => {
    memberLoginMock.mockRejectedValueOnce(new Error('Invalid Member ID'));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('Enter your Member ID'), {
      target: { value: 'ATB-BAD' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid Member ID')).toBeInTheDocument();
  });

  it('switches to the staff login form', () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /staff login/i }));

    expect(screen.getByText('Staff Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your Staff ID')).toBeInTheDocument();
  });

  it('moves to the OTP step after a valid Staff ID and password', async () => {
    global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/login')) {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      if (url.includes('/auth/staff-login-otp')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
      }
      return Promise.resolve({ ok: false, json: async () => ({}) } as Response);
    }) as jest.Mock;

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /staff login/i }));

    fireEvent.change(screen.getByPlaceholderText('Enter your Staff ID'), {
      target: { value: 'ATB-ADMIN-01' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('Enter the OTP sent to your mobile number')).toBeInTheDocument();
  });

  it('shows an error message when the staff password is invalid', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid password' }),
    } as Response);

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /staff login/i }));

    fireEvent.change(screen.getByPlaceholderText('Enter your Staff ID'), {
      target: { value: 'ATB-ADMIN-01' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('Invalid password')).toBeInTheDocument();
  });
});
