import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ClaimStatus } from '../common/enums/claim-status.enum';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  member: User;

  @Column()
  memberId: string;

  @Column()
  surgeryType: string;

  @Column()
  hospitalName: string;

  @Column({ type: 'date' })
  admissionDate: Date;

  @Column({ type: 'date', nullable: true })
  operationDate: Date;

  @Column({ nullable: true })
  doctorName: string;

  @Column({ nullable: true })
  doctorInfo: string;

  @Column('simple-array', { nullable: true })
  documents: string[]; // URLs to uploaded documents

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  claimedAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  approvedAmount: number;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.SUBMITTED,
  })
  status: ClaimStatus;

  @Column({ nullable: true })
  reviewedBy: string; // Admin/Claim team member ID

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  hospitalVerifiedBy: string; // Hospital user ID

  @Column({ nullable: true })
  hospitalVerifiedAt: Date;

  @Column({ nullable: true })
  approvedBy: string; // Admin who approved (maker)

  @Column({ nullable: true })
  checkerApprovedBy: string; // Admin who checked (checker - dual control)

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isDisbursed: boolean;

  @Column({ nullable: true })
  disbursedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
