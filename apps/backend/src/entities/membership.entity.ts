import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.membership, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1000.0,
  })
  membershipFee: number;

  @Column({ default: false })
  isPaymentVerified: boolean;

  @Column({ nullable: true })
  paymentMethod: string; // bkash, nagad, rocket, bank, gateway

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  paymentVerifiedBy: string; // Admin ID who verified

  @Column({ nullable: true })
  paymentVerifiedAt: Date;

  @Column({ type: 'date', nullable: true })
  membershipStartDate: Date;

  @Column({ type: 'date', nullable: true })
  membershipEndDate: Date;

  @Column({ default: false })
  isActive: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 12000.0,
  })
  remainingBenefit: number; // Remaining claimable amount this year

  @Column({ default: 0 })
  renewalCount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 850.0,
  })
  renewalFee: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
