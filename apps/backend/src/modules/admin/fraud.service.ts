import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';

export interface FraudAlert {
  type:
    | 'duplicate_nid'
    | 'duplicate_mobile'
    | 'duplicate_payment'
    | 'multiple_accounts_ip'
    | 'rapid_registrations';
  severity: 'high' | 'medium' | 'low';
  message: string;
  entityId?: string;
  details: any;
}

@Injectable()
export class FraudService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Run all fraud checks and return alerts
   */
  async runFraudChecks(): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // Check 1: Duplicate NID
    const nidDuplicates = await this.userRepository
      .createQueryBuilder('user')
      .select('user.nid, COUNT(*)', 'count')
      .where('user.nid IS NOT NULL')
      .groupBy('user.nid')
      .having('COUNT(*) > 1')
      .getRawMany();

    for (const dup of nidDuplicates) {
      const users = await this.userRepository.find({
        where: { nid: dup.user_nid },
        select: ['id', 'memberId', 'fullName', 'mobileNumber'],
      });

      alerts.push({
        type: 'duplicate_nid',
        severity: 'high',
        message: `NID ${dup.user_nid} is associated with ${dup.count} accounts`,
        details: { nid: dup.user_nid, users },
      });
    }

    // Check 2: Duplicate mobile numbers (shouldn't happen due to unique constraint, but check)
    const mobileDuplicates = await this.userRepository
      .createQueryBuilder('user')
      .select('user.mobileNumber, COUNT(*)', 'count')
      .groupBy('user.mobileNumber')
      .having('COUNT(*) > 1')
      .getRawMany();

    for (const dup of mobileDuplicates) {
      alerts.push({
        type: 'duplicate_mobile',
        severity: 'high',
        message: `Mobile ${dup.user_mobileNumber} has ${dup.count} accounts`,
        details: { mobile: dup.user_mobileNumber, count: dup.count },
      });
    }

    // Check 3: Rapid registrations (more than 5 in 1 hour from same IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const rapidRegs = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.ipAddress, COUNT(*)', 'count')
      .where('log.action = :action', { action: 'USER_REGISTERED' })
      .andWhere('log.createdAt > :time', { time: oneHourAgo })
      .groupBy('log.ipAddress')
      .having('COUNT(*) > 5')
      .getRawMany();

    for (const reg of rapidRegs) {
      alerts.push({
        type: 'rapid_registrations',
        severity: 'medium',
        message: `${reg.count} registrations from IP ${reg.log_ipAddress} in the last hour`,
        details: { ip: reg.log_ipAddress, count: reg.count },
      });
    }

    // Check 4: Duplicate transaction IDs in payments
    const txnDuplicates = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.transactionId, COUNT(*)', 'count')
      .where('payment.transactionId IS NOT NULL')
      .groupBy('payment.transactionId')
      .having('COUNT(*) > 1')
      .getRawMany();

    for (const dup of txnDuplicates) {
      alerts.push({
        type: 'duplicate_payment',
        severity: 'high',
        message: `Transaction ID ${dup.payment_transactionId} used ${dup.count} times`,
        details: { transactionId: dup.payment_transactionId, count: dup.count },
      });
    }

    return alerts;
  }

  /**
   * Check a specific user for fraud indicators
   */
  async checkUser(userId: string): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) return alerts;

    // Check for same NID
    if (user.nid) {
      const sameNid = await this.userRepository.count({
        where: { nid: user.nid },
      });
      if (sameNid > 1) {
        alerts.push({
          type: 'duplicate_nid',
          severity: 'high',
          message: `NID ${user.nid} has ${sameNid} accounts`,
          entityId: userId,
          details: { nid: user.nid, count: sameNid },
        });
      }
    }

    return alerts;
  }
}
