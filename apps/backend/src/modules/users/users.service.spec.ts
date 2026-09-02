import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Agent } from '../../entities/agent.entity';
import { UserRole } from '../../common/enums/user-role.enum';

function mockQueryBuilder(result: { items: unknown[]; total: number }) {
  return {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([result.items, result.total]),
    getMany: jest.fn().mockResolvedValue(result.items),
  };
}

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAgentRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the user with the password stripped', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'u1',
        memberId: 'ATB-001',
        password: 'hashed',
      });

      const result = await service.findById('u1');

      expect(result.password).toBeUndefined();
      expect(result.memberId).toBe('ATB-001');
    });
  });

  describe('findByMemberId', () => {
    it('throws NotFoundException when no member matches', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findByMemberId('ATB-999')).rejects.toThrow(NotFoundException);
    });

    it('returns the member with the password stripped', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ memberId: 'ATB-001', password: 'x' });

      const result = await service.findByMemberId('ATB-001');

      expect(result.password).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('paginates and strips passwords for every user', async () => {
      mockUserRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({
          items: [
            { id: 'u1', password: 'a' },
            { id: 'u2', password: 'b' },
          ],
          total: 2,
        }),
      );

      const result = await service.findAll(1, 20);

      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.users.every((u) => u.password === undefined)).toBe(true);
    });
  });

  describe('findByReferrer', () => {
    it('returns an empty page when the user has no agent record', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.findByReferrer('u1', 1, 20);

      expect(result).toEqual({ users: [], total: 0, page: 1, totalPages: 1 });
    });

    it('returns members referred by the agent with passwords stripped', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({ agentCode: 'ATB-AG-001' });
      mockUserRepository.findAndCount.mockResolvedValueOnce([[{ id: 'u1', password: 'a' }], 1]);

      const result = await service.findByReferrer('u1', 1, 20);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { referralId: 'ATB-AG-001', role: UserRole.MEMBER },
        }),
      );
      expect(result.total).toBe(1);
      expect(result.users[0].password).toBeUndefined();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.update('missing', {}, 'admin-1', UserRole.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('forbids a member from updating another user', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'u2' });

      await expect(service.update('u2', {}, 'u1', UserRole.MEMBER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('forbids a non-admin from changing a role', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'u1' });

      await expect(
        service.update('u1', { role: UserRole.ADMIN }, 'u1', UserRole.OWNER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates the user and strips the password field from input and output', async () => {
      const existing = { id: 'u1', fullName: 'Old Name', password: 'hashed' };
      mockUserRepository.findOne.mockResolvedValueOnce(existing);
      mockUserRepository.save.mockImplementationOnce((u: unknown) => Promise.resolve(u));

      const result = await service.update(
        'u1',
        { fullName: 'New Name', password: 'attempted-override' } as Partial<User>,
        'u1',
        UserRole.MEMBER,
      );

      expect(result.fullName).toBe('New Name');
      expect(result.password).toBeUndefined();
    });
  });

  describe('deactivate', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.deactivate('missing')).rejects.toThrow(NotFoundException);
    });

    it('marks the user inactive', async () => {
      const user = { id: 'u1', isActive: true };
      mockUserRepository.findOne.mockResolvedValueOnce(user);
      mockUserRepository.save.mockResolvedValueOnce({ ...user, isActive: false });

      const result = await service.deactivate('u1');

      expect(result).toEqual({ success: true });
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('getStats', () => {
    it('aggregates member counts by activity and role', async () => {
      mockUserRepository.count
        .mockResolvedValueOnce(100) // totalMembers
        .mockResolvedValueOnce(80) // activeMembers
        .mockResolvedValueOnce(5) // newMembersThisMonth
        .mockResolvedValueOnce(2) // ADMIN
        .mockResolvedValueOnce(3) // OWNER
        .mockResolvedValueOnce(10) // AGENT
        .mockResolvedValueOnce(100); // MEMBER

      const result = await service.getStats();

      expect(result.totalMembers).toBe(100);
      expect(result.activeMembers).toBe(80);
      expect(result.inactiveMembers).toBe(20);
      expect(result.newMembersThisMonth).toBe(5);
      expect(result.membersByRole[UserRole.MEMBER]).toBe(100);
    });
  });

  describe('search', () => {
    it('returns matching users with passwords stripped', async () => {
      mockUserRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({ items: [{ id: 'u1', password: 'x' }], total: 1 }),
      );

      const result = await service.search('01700000000');

      expect(result).toHaveLength(1);
      expect(result[0].password).toBeUndefined();
    });
  });
});
