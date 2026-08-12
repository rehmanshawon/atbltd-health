import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ default: false })
  isPartner: boolean; // Only partners can verify claims

  @Column({ nullable: true })
  mouDocument: string; // URL to signed MOU

  @Column({ nullable: true })
  loginId: string;

  @Column({ nullable: true })
  password: string; // Hashed - hospital portal login

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
