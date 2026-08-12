import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimService } from './claim.service';
import { ClaimController } from './claim.controller';
import { Claim } from '../../entities/claim.entity';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Claim,
      ClaimDocument,
      Membership,
      Payment,
      AuditLog,
    ]),
  ],
  controllers: [ClaimController],
  providers: [ClaimService],
  exports: [ClaimService],
})
export class ClaimModule {}
