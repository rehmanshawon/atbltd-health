import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Commission } from './commission.entity';

export enum AgentApprovalStatus {
  PENDING = 'pending',
  APPROVED_BY_ADMIN = 'approved_by_admin',
  APPROVED_BY_SA = 'approved_by_sa',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  DEACTIVATION_PENDING = 'deactivation_pending',
  DEACTIVATION_APPROVED_BY_ADMIN = 'deactivation_approved_by_admin',
  DEACTIVATED = 'deactivated',
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Every agent is a user first
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ unique: true })
  agentCode: string; // e.g., AGT-2026-0001

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10.0,
  })
  commissionRate: number; // Percentage

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalCommissionEarned: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalCommissionPaid: number;

  @Column({ default: 0 })
  totalMembersRegistered: number;

  @Column({ default: 0 })
  activeMembers: number;

  // Hierarchy: Agent → Sub-agents
  @ManyToOne(() => Agent, (agent) => agent.subAgents, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  parentAgent: Agent;

  @Column({ nullable: true })
  parentAgentId: string;

  @OneToMany(() => Agent, (agent) => agent.parentAgent)
  subAgents: Agent[];

  @OneToMany(() => Commission, (commission) => commission.agent)
  commissions: Commission[];

  @Column({
    type: 'enum',
    enum: AgentApprovalStatus,
    default: AgentApprovalStatus.ACTIVE,
  })
  approvalStatus: AgentApprovalStatus;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string; // Admin's member ID who created this agent/owner

  @Column({ nullable: true })
  createdByName: string; // Admin's full name

  @Column({ nullable: true })
  createdByRole: string; // super_admin / admin / owner
}
