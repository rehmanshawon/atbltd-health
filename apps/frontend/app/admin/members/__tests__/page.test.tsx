import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MembersPage from '../page';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

const findAllMock = jest.fn();
const searchMock = jest.fn();

jest.mock('../../../lib/api', () => ({
  usersApi: {
    findAll: (...args: unknown[]) => findAllMock(...args),
    search: (...args: unknown[]) => searchMock(...args),
  },
}));

const member = {
  id: 'user-1',
  memberId: 'ATB-001',
  fullName: 'Jane Doe',
  mobileNumber: '01700000000',
  role: 'member',
  isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z',
};

describe('MembersPage', () => {
  beforeEach(() => {
    findAllMock.mockReset();
    searchMock.mockReset();
  });

  it('renders members returned by the API', async () => {
    findAllMock.mockResolvedValueOnce({ users: [member], total: 1, totalPages: 1 });

    render(<MembersPage />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(findAllMock).toHaveBeenCalledWith('test-token', 1, 'member');
  });

  it('searches members and shows the matching results', async () => {
    findAllMock.mockResolvedValueOnce({ users: [], total: 0, totalPages: 1 });
    searchMock.mockResolvedValueOnce([member]);

    render(<MembersPage />);
    await waitFor(() => expect(findAllMock).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: '01700000000' },
    });
    fireEvent.submit(screen.getByPlaceholderText(/search/i).closest('form')!);

    await waitFor(() => expect(searchMock).toHaveBeenCalledWith('test-token', '01700000000'));
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  });
});
