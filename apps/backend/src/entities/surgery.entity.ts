import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('surgeries')
export class Surgery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nameEn: string;

  @Column()
  nameBn: string;

  @Column({ nullable: true })
  category: string; // e.g., General Surgery, Cardiac, Orthopedic

  @Column({ default: true })
  isCovered: boolean; // Whether ATB covers this surgery

  @Column({ nullable: true })
  waitingPeriodDays: number; // Days before eligible

  @Column({ nullable: true })
  maxAssistance: number; // Max BDT assistance

  @Column({ nullable: true })
  requiredDocuments: string; // Comma-separated list

  @Column({ default: 1 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
