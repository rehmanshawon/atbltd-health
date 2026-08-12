import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospital } from '../../entities/hospital.entity';
import { Claim } from '../../entities/claim.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hospital, Claim, AuditLog])],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService],
})
export class HospitalModule {}
