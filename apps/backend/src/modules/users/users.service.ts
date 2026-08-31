import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Agent } from '../../entities/agent.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  /**
   * Get user by ID with membership data
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['membership'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    delete user.password;
    return user;
  }

  /**
   * Get user by Member ID
   */
  async findByMemberId(memberId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { memberId },
      relations: ['membership'],
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    delete user.password;
    return user;
  }

  /**
   * Get all users with pagination (Admin only)
   */
  async findAll(
    page = 1,
    limit = 20,
    role?: UserRole,
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.where('user.role = :role', { role });
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    users.forEach((user) => delete user.password);

    return {
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  async findByReferrer(userId: string, page: number, limit: number) {
    // Find the agent record
    const agent = await this.agentRepository.findOne({
      where: { userId },
    });

    if (!agent) return { users: [], total: 0, page, totalPages: 1 };

    const [users, total] = await this.userRepository.findAndCount({
      where: { referralId: agent.agentCode, role: UserRole.MEMBER },
      order: { createdAt: 'DESC' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    users.forEach((u) => delete u.password);

    return {
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * Update user (Admin only, or self-update for members)
   */
  async update(
    id: string,
    updateData: Partial<User>,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Members can only update their own profile
    if (currentUserRole === UserRole.MEMBER && currentUserId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Prevent role escalation
    if (updateData.role && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    // Don't allow password update through this method (use dedicated change-password)
    delete updateData.password;

    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Deactivate user (Admin only)
   */
  async deactivate(id: string): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return { success: true };
  }

  /**
   * Get dashboard statistics (Admin/Owner)
   */
  async getStats(): Promise<{
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    newMembersThisMonth: number;
    membersByRole: Record<UserRole, number>;
  }> {
    const totalMembers = await this.userRepository.count({
      where: { role: UserRole.MEMBER },
    });

    const activeMembers = await this.userRepository.count({
      where: { role: UserRole.MEMBER, isActive: true },
    });

    const inactiveMembers = totalMembers - activeMembers;

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newMembersThisMonth = await this.userRepository.count({
      where: {
        role: UserRole.MEMBER,
        createdAt: firstDayOfMonth,
      },
    });

    // Count by role
    const roles = [UserRole.ADMIN, UserRole.OWNER, UserRole.AGENT, UserRole.MEMBER];
    const membersByRole: Record<string, number> = {};

    for (const role of roles) {
      membersByRole[role] = await this.userRepository.count({
        where: { role },
      });
    }

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      newMembersThisMonth,
      membersByRole: membersByRole as Record<UserRole, number>,
    };
  }

  /**
   * Search members by mobile, NID, or name (for 24/7 call center)
   */
  async search(query: string): Promise<User[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.mobileNumber LIKE :query', { query: `%${query}%` })
      .orWhere('user.nid LIKE :query', { query: `%${query}%` })
      .orWhere('user.fullName LIKE :query', { query: `%${query}%` })
      .orWhere('user.memberId LIKE :query', { query: `%${query}%` })
      .take(10)
      .getMany();

    users.forEach((user) => delete user.password);
    return users;
  }
}
