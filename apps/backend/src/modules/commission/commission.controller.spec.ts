import { Test, TestingModule } from '@nestjs/testing';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';
import { AgentService } from '../agent/agent.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { CommissionStatus } from '../../entities/commission.entity';

describe('CommissionController', () => {
  let controller: CommissionController;
  let commissionService: CommissionService;
  let agentService: AgentService;

  const mockCommissionService = {
    findAll: jest.fn(),
    getAgentCommissionSummary: jest.fn(),
    approveCommission: jest.fn(),
    declineCommission: jest.fn(),
    confirmCommissionPayment: jest.fn(),
    reverseCommission: jest.fn(),
  };

  const mockAgentService = {
    getAgentByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionController],
      providers: [
        { provide: CommissionService, useValue: mockCommissionService },
        { provide: AgentService, useValue: mockAgentService },
      ],
    }).compile();

    controller = module.get<CommissionController>(CommissionController);
    commissionService = module.get<CommissionService>(CommissionService);
    agentService = module.get<AgentService>(AgentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all commissions for ADMIN/SUPER_ADMIN', async () => {
    mockCommissionService.findAll.mockResolvedValue({ commissions: [], total: 0 });
    const user = { sub: 'admin-1', role: UserRole.ADMIN };
    const result = await controller.findAll(
      user as any,
      'agent-1',
      CommissionStatus.PENDING,
      1,
      10,
    );
    expect(result).toEqual({ commissions: [], total: 0 });
    expect(commissionService.findAll).toHaveBeenCalledWith({
      agentId: 'agent-1',
      status: CommissionStatus.PENDING,
      page: 1,
      limit: 10,
      reviewerRole: UserRole.ADMIN,
    });
  });

  it('should find own commissions for OWNER/AGENT if agent record exists', async () => {
    mockAgentService.getAgentByUserId.mockResolvedValue({ id: 'agent-sub-1' });
    mockCommissionService.findAll.mockResolvedValue({ commissions: [{ id: 'comm-1' }] });
    const user = { sub: 'owner-1', role: UserRole.OWNER };
    const result = await controller.findAll(user as any, undefined, undefined, 2, 5);
    expect(result).toEqual({ commissions: [{ id: 'comm-1' }] });
    expect(agentService.getAgentByUserId).toHaveBeenCalledWith('owner-1');
    expect(commissionService.findAll).toHaveBeenCalledWith({
      agentId: 'agent-sub-1',
      status: undefined,
      page: 2,
      limit: 5,
    });
  });

  it('should return empty summary if agent profile not found for non-admins', async () => {
    mockAgentService.getAgentByUserId.mockResolvedValue(null);
    const user = { sub: 'user-x', role: UserRole.AGENT };
    const result = await controller.findAll(user as any);
    expect(result.commissions).toEqual([]);
  });

  it('should get agent commission summary', async () => {
    mockCommissionService.getAgentCommissionSummary.mockResolvedValue({ totalPaid: 500 });
    const result = await controller.getAgentSummary('agent-1');
    expect(result).toEqual({ totalPaid: 500 });
    expect(commissionService.getAgentCommissionSummary).toHaveBeenCalledWith('agent-1');
  });

  it('should approve, decline, confirm payment and reverse a commission', async () => {
    mockCommissionService.approveCommission.mockResolvedValue({ success: true });
    mockCommissionService.declineCommission.mockResolvedValue({ success: true });
    mockCommissionService.confirmCommissionPayment.mockResolvedValue({ success: true });
    mockCommissionService.reverseCommission.mockResolvedValue({ success: true });

    const user = { sub: 'admin-1', role: UserRole.SUPER_ADMIN };

    expect(await controller.approve('comm-1', user as any)).toEqual({ success: true });
    expect(await controller.decline('comm-1', user as any, 'Fraud')).toEqual({ success: true });
    expect(await controller.confirmPayment('comm-1', user as any)).toEqual({ success: true });
    expect(await controller.reverse('comm-1', user as any, 'Error')).toEqual({ success: true });
  });
});
