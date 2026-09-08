import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateAgentPage from '../page';
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

function setupAuth(role: 'super_admin' | 'admin' | 'owner') {
  (useAuth as jest.Mock).mockReturnValue({
    token: 'test-token',
    user: {
      memberId:
        role === 'super_admin' ? 'ATB-26-SA-1' : role === 'admin' ? 'ATB-26-AD-1' : 'ATB-26-OW-1',
      fullName: role === 'super_admin' ? 'System Administrator' : 'Test User',
      role,
      isActive: true,
    },
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
    login: jest.fn(),
    memberLogin: jest.fn(),
  });
}

describe('CreateAgentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form for super_admin with editable commission', async () => {
    setupAuth('super_admin');

    render(<CreateAgentPage />);

    expect(screen.getAllByText('Create Agent').length).toBeGreaterThan(0);
    expect(screen.getByText('Full Name *')).toBeInTheDocument();
    expect(screen.getByText('Mobile Number *')).toBeInTheDocument();
    expect(screen.getByText('Commission Rate (%) *')).toBeInTheDocument();
  });

  it('shows read-only commission for admin', async () => {
    setupAuth('admin');

    render(<CreateAgentPage />);

    expect(screen.getByText('Commission Rate (%)')).toBeInTheDocument();
    expect(screen.getByText('Only Super Admin can change this value')).toBeInTheDocument();
  });

  it('auto-fills parent agent code for owner', async () => {
    setupAuth('owner');

    render(<CreateAgentPage />);

    expect(screen.getByText('Parent Owner (Agent Code) *')).toBeInTheDocument();

    // Parent agent code should be auto-filled with owner's memberId
    const parentInput = screen.getByDisplayValue('ATB-26-OW-1');
    expect(parentInput).toBeInTheDocument();
    expect(parentInput).toHaveAttribute('readonly');
  });

  it('shows error when parent agent code is empty for admin', async () => {
    setupAuth('admin');
    render(<CreateAgentPage />);

    const fullNameInput = screen.getAllByRole('textbox')[0];
    const mobileInput = screen.getByPlaceholderText('01XXXXXXXXX');

    await userEvent.type(fullNameInput, 'Test Agent');
    await userEvent.type(mobileInput, '01712345678');

    // Find submit button by its text content
    const submitButton =
      screen.getAllByText('Create Agent')[1] || screen.getAllByText('Create Agent')[0];
    await userEvent.click(submitButton);

    expect(screen.getByText("Please enter the Parent Owner's Agent Code")).toBeInTheDocument();
  });
});
