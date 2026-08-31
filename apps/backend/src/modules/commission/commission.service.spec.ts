import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { Commission, CommissionStatus, CommissionType } from '../../entities/commission.entity';
import { Agent } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';

describe('CommissionService', () => {
  let service: CommissionService;

  const commissionRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const agentRepository = { findOne: jest.fn(), save: jest.fn() };
  const userRepository = { findOne: jest.fn() };
  const auditLogRepository = { save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: getRepositoryToken(Commission), useValue: commissionRepository },
        { provide: getRepositoryToken(Agent), useValue: agentRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(AuditLog), useValue: auditLogRepository },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    jest.clearAllMocks();
  });

  it('does not create a commission for a member without a referral', async () => {
    userRepository.findOne.mockResolvedValue({ id: 'member-1', referralId: null });

    await expect(service.createRegistrationCommission('member-1', 1000)).resolves.toBeNull();

    expect(agentRepository.findOne).not.toHaveBeenCalled();
    expect(commissionRepository.save).not.toHaveBeenCalled();
  });

  it('calculates and records a registration commission for an active referring agent', async () => {
    const agent = {
      id: 'agent-1',
      agentCode: 'AG-001',
      commissionRate: '12.5',
      totalCommissionEarned: '200',
      parentAgentId: null,
    };
    const commission = { id: 'commission-1' };
    userRepository.findOne.mockResolvedValue({
      id: 'member-1',
      memberId: 'ATB-26-ME-01',
      referralId: 'AG-001',
    });
    agentRepository.findOne.mockResolvedValue(agent);
    commissionRepository.findOne.mockResolvedValue(null);
    commissionRepository.create.mockImplementation((value) => value);
    commissionRepository.save.mockResolvedValue(commission);

    await expect(service.createRegistrationCommission('member-1', 1000)).resolves.toBe(commission);

    expect(commissionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commissionType: CommissionType.MEMBER_REGISTRATION,
        commissionRate: 12.5,
        commissionAmount: 125,
        status: CommissionStatus.PENDING,
      }),
    );
    expect(agent.totalCommissionEarned).toBe(325);
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COMMISSION_CREATED', entityId: 'commission-1' }),
    );
  });

  it('prevents the approving administrator from confirming payment', async () => {
    commissionRepository.findOne.mockResolvedValue({
      id: 'commission-1',
      status: CommissionStatus.APPROVED,
      approvedBy: 'admin-1',
    });

    await expect(service.confirmCommissionPayment('commission-1', 'admin-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(commissionRepository.save).not.toHaveBeenCalled();
  });

  it('allows a super administrator to decline a pending commission', async () => {
    const commission = { id: 'commission-1', status: CommissionStatus.PENDING, notes: null };
    commissionRepository.findOne.mockResolvedValue(commission);
    commissionRepository.save.mockResolvedValue(commission);

    const result = await service.declineCommission(
      'commission-1',
      'sa-1',
      'super_admin',
      'Payment details could not be verified',
    );

    expect(result.status).toBe(CommissionStatus.DECLINED);
    expect(result.notes).toBe('Payment details could not be verified');
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COMMISSION_DECLINED', performedById: 'sa-1' }),
    );
  });
});
