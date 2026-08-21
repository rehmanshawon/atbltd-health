import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  MEMBER_REGISTERED = 'member_registered',
  PAYMENT_VERIFIED = 'payment_verified',
  CLAIM_SUBMITTED = 'claim_submitted',
  CLAIM_APPROVED = 'claim_approved',
  CLAIM_REJECTED = 'claim_rejected',
  CLAIM_STATUS_UPDATED = 'claim_status_updated',
  COMMISSION_EARNED = 'commission_earned',
  COMMISSION_PAID = 'commission_paid',
  HOSPITAL_ASSIGNED = 'hospital_assigned',
  SYSTEM_ALERT = 'system_alert',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  recipient: User;

  @Column()
  recipientId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_ALERT,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  entityId: string; // Related record ID (claim, payment, etc.)

  @Column({ nullable: true })
  linkUrl: string; // Frontend URL to navigate to

  @CreateDateColumn()
  createdAt: Date;
}
