import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  MEMBERSHIP_FEE = 'membership_fee',
  RENEWAL = 'renewal',
  CLAIM_DISBURSEMENT = 'claim_disbursement',
  COMMISSION = 'commission',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.MEMBERSHIP_FEE,
  })
  paymentType: PaymentType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column()
  method: string; // bkash, nagad, rocket, bank_transfer, payment_gateway

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  senderAccount: string; // Phone number or account that sent payment

  @Column()
  recipientAccount: string; // Official ATB account that received

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  verifiedBy: string; // Admin ID

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  screenshotUrl: string; // Payment screenshot if uploaded

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
