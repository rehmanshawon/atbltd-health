import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from '../../common/enums/user-role.enum';

describe('UsersController', () => {
  const usersService = {
    findAll: jest.fn(),
    findByReferrer: jest.fn(),
  } as unknown as UsersService;
  const controller = new UsersController(usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all members for a super administrator', async () => {
    const response = { users: [{ id: 'member-1' }], total: 1, page: 1, totalPages: 1 };
    jest.spyOn(usersService, 'findAll').mockResolvedValue(response as never);

    await expect(
      controller.findAll(
        { sub: 'super-admin-1', role: UserRole.SUPER_ADMIN } as any,
        1,
        20,
        UserRole.MEMBER,
      ),
    ).resolves.toBe(response);

    expect(usersService.findAll).toHaveBeenCalledWith(1, 20, UserRole.MEMBER);
    expect(usersService.findByReferrer).not.toHaveBeenCalled();
  });
});
