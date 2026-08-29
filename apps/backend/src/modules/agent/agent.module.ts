import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { NotificationModule } from '../notification/notification.module';
import { SmsModule } from '../sms/sms.module';
import { AgentApprovalService } from './agent-approval.service';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, User, AuditLog]), NotificationModule, SmsModule],
  controllers: [AgentController],
  providers: [AgentService, AgentApprovalService],
  exports: [AgentService, AgentApprovalService],
})
export class AgentModule {}
