import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../../lib/auth-context';

jest.mock('../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockNotifications = [
  {
    id: 'notif-1',
    type: 'system_alert',
    title: 'New Member Registered',
    message: 'Test Member submitted an application',
    isRead: false,
    linkUrl: '/admin/members',
    createdAt: '2026-08-15T00:00:00.000Z',
  },
];

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: 'test-token',
      user: { memberId: 'ATB-26-SA-1', role: 'super_admin' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders bell icon with unread badge', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ notifications: mockNotifications, unreadCount: 1 }),
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  it('opens dropdown when bell clicked', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ notifications: mockNotifications, unreadCount: 1 }),
    });

    render(<NotificationBell />);

    const bellButton = document.querySelector('button');
    if (bellButton) await userEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('New Member Registered')).toBeInTheDocument();
    });
  });

  it('handles 401 silently', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({}),
    });

    render(<NotificationBell />);

    // Should not crash — just renders without unread badge
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
