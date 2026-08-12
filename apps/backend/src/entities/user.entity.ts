import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Membership } from './membership.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  memberId: string; // e.g., ATB-2026-000001

  @Column()
  fullName: string;

  @Column({ nullable: true })
  fatherName: string;

  @Column({ nullable: true })
  motherName: string;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth: Date;

  @Column({ unique: true, nullable: true })
  nid: string; // National ID

  @Column({ unique: true })
  mobileNumber: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  permanentAddress: string;

  @Column({ nullable: true })
  currentAddress: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column()
  password: string; // Hashed

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Column({ default: false })
  isKycVerified: boolean;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  referralId: string; // Agent's referral ID who onboarded this member

  @Column({ nullable: true })
  qrCode: string; // URL or base64 of QR code

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Membership, (membership) => membership.user)
  membership: Membership;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.performedBy)
  auditLogs: AuditLog[];
}
