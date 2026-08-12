import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Agent } from './agent.entity';

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  REVERSED = 'reversed',
}

export enum CommissionType {
  MEMBER_REGISTRATION = 'member_registration',
  RENEWAL = 'renewal',
  OVERRIDE = 'override', // Override commission for parent agent
}

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Agent, { onDelete: 'CASCADE' })
  @JoinColumn()
  agent: Agent;

  @Column()
  agentId: string;

  @Column()
  agentCode: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  member: User; // The member who registered

  @Column({ nullable: true })
  memberId: string;

  @Column({ nullable: true })
  memberCode: string; // Member's ATB ID

  @Column({
    type: 'enum',
    enum: CommissionType,
    default: CommissionType.MEMBER_REGISTRATION,
  })
  commissionType: CommissionType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  registrationAmount: number; // 1,000 BDT

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  commissionRate: number; // e.g., 10.00 for 10%

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  commissionAmount: number; // e.g., 100 BDT

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ nullable: true })
  approvedBy: string; // Admin ID (Maker)

  @Column({ nullable: true })
  checkerApprovedBy: string; // Admin ID (Checker) — dual control

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  reversedAt: Date;

  @Column({ nullable: true })
  reversalReason: string;

  @Column({ nullable: true })
  paymentTransactionId: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
