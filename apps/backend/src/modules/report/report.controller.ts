import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('members')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getMemberReport(@Res() res: Response, @CurrentUser() user: JwtPayload) {
    const pdf = await this.reportService.generateMemberReport(user.role);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=member-report.pdf');
    res.send(pdf);
  }

  @Get('payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPaymentReport(@Res() res: Response) {
    const pdf = await this.reportService.generatePaymentReport();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=payment-report.pdf');
    res.send(pdf);
  }

  @Get('claims')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getClaimReport(@Res() res: Response) {
    const pdf = await this.reportService.generateClaimReport();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=claim-report.pdf');
    res.send(pdf);
  }

  @Get('agents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAgentReport(@Res() res: Response) {
    const pdf = await this.reportService.generateAgentReport();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=agent-report.pdf');
    res.send(pdf);
  }

  @Get('audit')
  @Roles(UserRole.SUPER_ADMIN)
  async getAuditReport(@Res() res: Response) {
    const pdf = await this.reportService.generateAuditReport();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-report.pdf');
    res.send(pdf);
  }
}
