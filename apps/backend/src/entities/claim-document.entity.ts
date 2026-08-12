import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity('claim_documents')
export class ClaimDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Claim, { onDelete: 'CASCADE' })
  @JoinColumn()
  claim: Claim;

  @Column()
  claimId: string;

  @Column()
  documentType: string; // e.g., "Discharge Summary", "OT Note", "Paid Bill", "Prescription"

  @Column()
  fileUrl: string; // URL to stored file

  @Column()
  fileName: string; // Original filename

  @Column({ nullable: true })
  notes: string; // Member's notes about this document

  @Column({ default: false })
  isVerified: boolean; // Admin verified this document

  @CreateDateColumn()
  createdAt: Date;
}
