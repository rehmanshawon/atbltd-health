import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospital } from '../../entities/hospital.entity';
import { Claim } from '../../entities/claim.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { NotificationModule } from '../notification/notification.module';
import { SmsModule } from '../sms/sms.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Hospital, Claim, ClaimDocument, AuditLog]),
    NotificationModule,
    SmsModule,
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService],
})
export class HospitalModule {}
