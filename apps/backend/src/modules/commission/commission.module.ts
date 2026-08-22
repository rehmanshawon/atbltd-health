import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from '../../entities/commission.entity';
import { Agent } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { AgentModule } from '../agent/agent.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Commission, Agent, User, AuditLog]),
    AgentModule,
  ],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
