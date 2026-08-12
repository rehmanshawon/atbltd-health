import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'SET NULL' })
  @JoinColumn()
  performedBy: User;

  @Column({ nullable: true })
  performedById: string;

  @Column()
  action: string; // e.g., 'USER_REGISTERED', 'PAYMENT_VERIFIED', 'CLAIM_APPROVED'

  @Column()
  entity: string; // e.g., 'User', 'Payment', 'Claim'

  @Column({ nullable: true })
  entityId: string; // ID of the affected record

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, any>; // Previous state

  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, any>; // New state

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ default: false })
  requiresReview: boolean; // Flag for suspicious activity

  @CreateDateColumn()
  createdAt: Date;
}
