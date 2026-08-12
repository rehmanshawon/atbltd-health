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

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
