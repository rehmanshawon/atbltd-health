import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentStatus } from '../../entities/payment.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { FraudService } from './fraud.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly fraudService: FraudService,
  ) {}

  /**
   * GET /api/admin/dashboard
   * Dashboard statistics
   */
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  /**
   * GET /api/admin/payments
   * List all payments with optional status filter
   */
  @Get('payments')
  async getPayments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.adminService.getPayments(status, page, limit);
  }

  /**
   * GET /api/admin/payments/pending
   * Get all pending payments that need verification
   */
  @Get('payments/pending')
  async getPendingPayments() {
    return this.adminService.getPendingPayments();
  }

  /**
   * POST /api/admin/payments/:id/verify
   * Verify a payment (Maker role)
   */
  @Post('payments/:id/verify')
  async verifyPayment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.verifyPayment(id, user.sub);
  }

  /**
   * GET /api/admin/audit-logs
   * View audit logs
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getAuditLogs(page, limit);
  }

  /**
   * GET /api/admin/fraud-check — Run all fraud checks
   */
  @Get('fraud-check')
  async runFraudChecks() {
    return this.fraudService.runFraudChecks();
  }

  /**
   * GET /api/admin/fraud-check/:userId — Check specific user
   */
  @Get('fraud-check/:userId')
  async checkUserFraud(@Param('userId') userId: string) {
    return this.fraudService.checkUser(userId);
  }
}
