import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users/stats
   * Admin/Owner only - Dashboard statistics
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getStats() {
    return this.usersService.getStats();
  }

  /**
   * GET /api/users/search?q=01711
   * Admin/Owner/Agent - Search members (for call center)
   */
  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.AGENT)
  async search(@Query('q') query: string) {
    return this.usersService.search(query);
  }

  /**
   * GET /api/users
   * Admin/Owner - Get all users with pagination
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.AGENT)
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.usersService.findAll(page, limit, role);
    }

    // Owner/Agent: only members they referred
    return this.usersService.findByReferrer(user.sub, page, limit);
  }

  /**
   * GET /api/users/:id
   * Admin/Owner can view any user; Members can only view themselves
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    // Members can only view their own profile
    if (currentUser.role === UserRole.MEMBER && currentUser.sub !== id) {
      return this.usersService.findById(currentUser.sub);
    }
    return this.usersService.findById(id);
  }

  /**
   * PUT /api/users/:id
   * Update user profile
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.update(
      id,
      updateData,
      currentUser.sub,
      currentUser.role as UserRole,
    );
  }
}
