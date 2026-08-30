import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment, Claim, Agent, AuditLog])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
