import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CommissionModule } from '../commission/commission.module';
import { FraudService } from './fraud.service';
import { SmsModule } from '../sms/sms.module';
import { NotificationModule } from '../notification/notification.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Membership, Payment, Claim, Agent, AuditLog]),
    CommissionModule,
    SmsModule,
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, FraudService],
  exports: [AdminService],
})
export class AdminModule {}
