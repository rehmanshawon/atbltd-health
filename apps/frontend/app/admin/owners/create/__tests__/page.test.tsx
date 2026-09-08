import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateOwnerPage from '../page';
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

describe('CreateOwnerPage', () => {
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

  it('renders create owner form', async () => {
    render(<CreateOwnerPage />);
    expect(screen.getAllByText('Create Owner').length).toBeGreaterThan(0);
    expect(screen.getByText('Full Name *')).toBeInTheDocument();
    expect(screen.getByText('Mobile Number *')).toBeInTheDocument();
    expect(screen.getByText('Commission Rate (%) *')).toBeInTheDocument();
  });

  it('submits form with correct payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        agent: { agentCode: 'ATB-26-OW-3' },
      }),
    });

    (global as any).fetch = fetchMock;

    render(<CreateOwnerPage />);

    await userEvent.type(screen.getAllByRole('textbox')[0], 'New Owner');
    await userEvent.type(screen.getByPlaceholderText('01XXXXXXXXX'), '01712345678');

    const submitBtn = screen.getAllByText('Create Owner').pop()!;
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/agents'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows commission rate field for super_admin', async () => {
    render(<CreateOwnerPage />);

    expect(screen.getByText('Commission Rate (%) *')).toBeInTheDocument();
  });

  it('shows email field', async () => {
    render(<CreateOwnerPage />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});
