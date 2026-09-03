import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import * as fc from 'fast-check';
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

  it('calculates registration commissions correctly across valid amounts and rates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 1, max: 100 }),
        async (registrationAmount, commissionRate) => {
          jest.clearAllMocks();
          const agent = {
            id: 'agent-1',
            agentCode: 'AG-001',
            commissionRate: String(commissionRate),
            totalCommissionEarned: '0',
            parentAgentId: null,
          };
          userRepository.findOne.mockResolvedValue({
            id: 'member-1',
            memberId: 'ATB-26-ME-01',
            referralId: 'AG-001',
          });
          agentRepository.findOne.mockResolvedValue(agent);
          commissionRepository.findOne.mockResolvedValue(null);
          commissionRepository.create.mockImplementation((value) => value);
          commissionRepository.save.mockResolvedValue({ id: 'commission-1' });

          await service.createRegistrationCommission('member-1', registrationAmount);

          expect(commissionRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
              commissionRate,
              commissionAmount: (registrationAmount * commissionRate) / 100,
            }),
          );
        },
      ),
    );
  });

  it('returns the existing commission instead of creating a duplicate', async () => {
    const existing = { id: 'commission-1', status: CommissionStatus.PENDING };
    userRepository.findOne.mockResolvedValue({
      id: 'member-1',
      memberId: 'ATB-26-ME-01',
      referralId: 'AG-001',
    });
    agentRepository.findOne.mockResolvedValue({ id: 'agent-1', agentCode: 'AG-001' });
    commissionRepository.findOne.mockResolvedValue(existing);

    await expect(service.createRegistrationCommission('member-1', 1000)).resolves.toBe(existing);

    expect(commissionRepository.create).not.toHaveBeenCalled();
    expect(commissionRepository.save).not.toHaveBeenCalled();
  });

  it('does not create a commission for an inactive referring agent', async () => {
    userRepository.findOne.mockResolvedValue({ id: 'member-1', referralId: 'AG-001' });
    agentRepository.findOne.mockResolvedValue(null);

    await expect(service.createRegistrationCommission('member-1', 1000)).resolves.toBeNull();

    expect(commissionRepository.findOne).not.toHaveBeenCalled();
    expect(commissionRepository.save).not.toHaveBeenCalled();
  });

  it('creates an owner override using only the rate difference', async () => {
    const agent = {
      id: 'agent-1',
      agentCode: 'AG-001',
      commissionRate: '10',
      totalCommissionEarned: '0',
      parentAgentId: 'owner-1',
    };
    const owner = {
      id: 'owner-1',
      agentCode: 'OW-001',
      commissionRate: '15',
      totalCommissionEarned: '100',
    };
    userRepository.findOne.mockResolvedValue({
      id: 'member-1',
      memberId: 'ATB-26-ME-01',
      referralId: 'AG-001',
    });
    agentRepository.findOne.mockResolvedValueOnce(agent).mockResolvedValueOnce(owner);
    commissionRepository.findOne.mockResolvedValue(null);
    commissionRepository.create.mockImplementation((value) => value);
    commissionRepository.save.mockImplementation((value) =>
      Promise.resolve({ id: 'saved', ...value }),
    );

    await service.createRegistrationCommission('member-1', 1000);

    expect(commissionRepository.create).toHaveBeenCalledTimes(2);
    expect(commissionRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        commissionType: CommissionType.OVERRIDE,
        agentId: 'owner-1',
        commissionRate: 5,
        commissionAmount: 50,
      }),
    );
    expect(agent.totalCommissionEarned).toBe(100);
    expect(owner.totalCommissionEarned).toBe(150);
  });

  it('confirms payment with a different checker and updates paid totals', async () => {
    const commission = {
      id: 'commission-1',
      status: CommissionStatus.APPROVED,
      approvedBy: 'admin-1',
      checkerApprovedBy: null,
      agentId: 'agent-1',
      commissionAmount: '250',
    };
    const agent = { id: 'agent-1', totalCommissionPaid: '1000' };
    commissionRepository.findOne.mockResolvedValue(commission);
    commissionRepository.save.mockResolvedValue(commission);
    agentRepository.findOne.mockResolvedValue(agent);

    await service.confirmCommissionPayment('commission-1', 'admin-2');

    expect(commission.status).toBe(CommissionStatus.PAID);
    expect(commission.checkerApprovedBy).toBe('admin-2');
    expect(agent.totalCommissionPaid).toBe(1250);
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COMMISSION_PAID', performedById: 'admin-2' }),
    );
  });

  it('reverses a paid commission and deducts earned and paid totals', async () => {
    const commission = {
      id: 'commission-1',
      status: CommissionStatus.PAID,
      agentId: 'agent-1',
      commissionAmount: '500',
      reversalReason: null,
    };
    const agent = {
      id: 'agent-1',
      totalCommissionEarned: '2000',
      totalCommissionPaid: '1500',
    };
    commissionRepository.findOne.mockResolvedValue(commission);
    commissionRepository.save.mockResolvedValue(commission);
    agentRepository.findOne.mockResolvedValue(agent);

    await service.reverseCommission('commission-1', 'sa-1', 'Fraud detected');

    expect(commission.status).toBe(CommissionStatus.REVERSED);
    expect(commission.reversalReason).toBe('Fraud detected');
    expect(agent.totalCommissionEarned).toBe(1500);
    expect(agent.totalCommissionPaid).toBe(1000);
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COMMISSION_REVERSED', performedById: 'sa-1' }),
    );
  });

  it('filters commissions for super-admin payout review', async () => {
    commissionRepository.findAndCount.mockResolvedValue([[], 0]);

    await expect(
      service.findAll({ reviewerRole: UserRole.SUPER_ADMIN, page: 2, limit: 10 }),
    ).resolves.toEqual({ commissions: [], total: 0, page: 2, totalPages: 0 });

    expect(commissionRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          approvedBy: Not(IsNull()),
          checkerApprovedBy: null,
          status: CommissionStatus.APPROVED,
        },
        skip: 10,
        take: 10,
      }),
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
