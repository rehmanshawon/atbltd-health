import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentApprovalService } from './agent-approval.service';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AgentController', () => {
  let controller: AgentController;
  let agentService: AgentService;
  let agentApprovalService: AgentApprovalService;

  const mockAgentService = {
    createAgent: jest.fn(),
    getAgentsOnly: jest.fn(),
    getAgentByUserId: jest.fn(),
    getAgentsByParent: jest.fn(),
    getAllAgents: jest.fn(),
  };

  const mockAgentApprovalService = {
    requestDeactivation: jest.fn(),
    getPendingApprovals: jest.fn(),
    approveAgent: jest.fn(),
    declineAgent: jest.fn(),
    approveDeactivation: jest.fn(),
    declineDeactivation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        { provide: AgentService, useValue: mockAgentService },
        { provide: AgentApprovalService, useValue: mockAgentApprovalService },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
    agentService = module.get<AgentService>(AgentService);
    agentApprovalService = module.get<AgentApprovalService>(AgentApprovalService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an agent', async () => {
    const dto = { fullName: 'Test', mobileNumber: '123', role: UserRole.AGENT, commissionRate: 5 };
    mockAgentService.createAgent.mockResolvedValue({ id: 'agent-1' });
    const result = await controller.createAgent({ sub: 'user-1' } as any, dto as any);
    expect(result).toEqual({ id: 'agent-1' });
    expect(agentService.createAgent).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('should get all agents for admin/super_admin', async () => {
    mockAgentService.getAgentsOnly.mockResolvedValue([]);
    const result = await controller.getAllAgents({ role: UserRole.ADMIN, sub: 'admin-1' } as any);
    expect(result).toEqual([]);
    expect(agentService.getAgentsOnly).toHaveBeenCalled();
  });

  it('should get sub-agents for owner/agent role if agent profile exists', async () => {
    mockAgentService.getAgentByUserId.mockResolvedValue({ id: 'owner-agent-id' });
    mockAgentService.getAgentsByParent.mockResolvedValue([{ id: 'sub-1' }]);
    const result = await controller.getAllAgents({ role: UserRole.OWNER, sub: 'user-1' } as any);
    expect(result).toEqual([{ id: 'sub-1' }]);
    expect(agentService.getAgentsByParent).toHaveBeenCalledWith('owner-agent-id');
  });

  it('should return empty array if agent profile not found for owner/agent getMyAgents', async () => {
    mockAgentService.getAgentByUserId.mockResolvedValue(null);
    const result = await controller.getMyAgents({ sub: 'user-1' } as any);
    expect(result).toEqual([]);
  });

  it('should get current user agent profile', async () => {
    mockAgentService.getAgentByUserId.mockResolvedValue({ id: 'agent-1' });
    const result = await controller.getMyProfile({ sub: 'user-1' } as any);
    expect(result).toEqual({ id: 'agent-1' });
  });

  it('should request deactivation', async () => {
    mockAgentApprovalService.requestDeactivation.mockResolvedValue({ success: true });
    const result = await controller.deactivateAgent('agent-1', {
      sub: 'admin-1',
      role: UserRole.ADMIN,
    } as any);
    expect(result).toEqual({ success: true });
    expect(agentApprovalService.requestDeactivation).toHaveBeenCalledWith(
      'agent-1',
      'admin-1',
      UserRole.ADMIN,
    );
  });

  it('should get owners list', async () => {
    mockAgentService.getAllAgents.mockResolvedValue([
      { id: '1', user: { role: UserRole.OWNER } },
      { id: '2', user: { role: UserRole.AGENT } },
    ]);
    const result = await controller.getOwners();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should get pending approvals', async () => {
    mockAgentApprovalService.getPendingApprovals.mockResolvedValue([]);
    const result = await controller.getPendingApprovals({ role: UserRole.ADMIN } as any);
    expect(result).toEqual([]);
    expect(agentApprovalService.getPendingApprovals).toHaveBeenCalledWith(UserRole.ADMIN);
  });

  it('should approve agent', async () => {
    mockAgentApprovalService.approveAgent.mockResolvedValue({ status: 'APPROVED' });
    const result = await controller.approveAgent('agent-1', {
      sub: 'admin-1',
      role: UserRole.ADMIN,
    } as any);
    expect(result).toEqual({ status: 'APPROVED' });
  });

  it('should decline agent', async () => {
    mockAgentApprovalService.declineAgent.mockResolvedValue({ status: 'DECLINED' });
    const result = await controller.declineAgent(
      'agent-1',
      { sub: 'admin-1', role: UserRole.SUPER_ADMIN } as any,
      'Reason',
    );
    expect(result).toEqual({ status: 'DECLINED' });
    expect(agentApprovalService.declineAgent).toHaveBeenCalledWith(
      'agent-1',
      'admin-1',
      UserRole.SUPER_ADMIN,
      'Reason',
    );
  });

  it('should approve and decline deactivation requests', async () => {
    mockAgentApprovalService.approveDeactivation.mockResolvedValue({ success: true });
    mockAgentApprovalService.declineDeactivation.mockResolvedValue({ success: true });

    const res1 = await controller.approveDeactivation('agent-1', {
      sub: 'admin-1',
      role: UserRole.ADMIN,
    } as any);
    expect(res1).toEqual({ success: true });

    const res2 = await controller.declineDeactivation(
      'agent-1',
      { sub: 'admin-1', role: UserRole.SUPER_ADMIN } as any,
      'No',
    );
    expect(res2).toEqual({ success: true });
  });
});
