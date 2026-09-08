import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HospitalLoginPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('HospitalLoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        accessToken: 'hospital-token',
        hospital: { id: 'h1', name: 'Square Hospital', loginId: 'square.hospital' },
      }),
    });
  });

  it('renders login form', async () => {
    render(<HospitalLoginPage />);

    expect(screen.getByText('Hospital Login')).toBeInTheDocument();
    expect(screen.getByText('Login ID')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('submits login credentials', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        accessToken: 'hospital-token',
        hospital: { id: 'h1', name: 'Square Hospital', loginId: 'square.hospital' },
      }),
    });

    (global as any).fetch = fetchMock;

    render(<HospitalLoginPage />);

    await userEvent.type(screen.getByPlaceholderText('hospital@atbltd'), 'square.hospital');
    await userEvent.type(screen.getByPlaceholderText('Enter password'), 'password123');

    await userEvent.click(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/hospitals/login'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows error on failed login', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ message: 'Invalid credentials' }),
    });

    render(<HospitalLoginPage />);

    await userEvent.type(screen.getByPlaceholderText('hospital@atbltd'), 'wrong');
    await userEvent.type(screen.getByPlaceholderText('Enter password'), 'wrong');

    await userEvent.click(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
