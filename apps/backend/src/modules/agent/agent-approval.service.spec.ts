import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AgentApprovalService } from './agent-approval.service';
import { Agent, AgentApprovalStatus } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';

describe('AgentApprovalService', () => {
  let service: AgentApprovalService;

  const mockAgentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
    save: jest.fn(),
  };

  const mockNotificationService = {
    notifyRoles: jest.fn(),
    notifyUser: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentApprovalService,
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<AgentApprovalService>(AgentApprovalService);

    jest.clearAllMocks();
    mockAgentRepository.findOne.mockReset();
    mockAgentRepository.find.mockReset();
    mockAgentRepository.save.mockReset();
    mockUserRepository.findOne.mockReset();
    mockUserRepository.find.mockReset();
    mockUserRepository.save.mockReset();
    mockAuditLogRepository.save.mockReset();
    mockNotificationService.notifyRoles.mockReset();
    mockNotificationService.notifyUser.mockReset();
    mockSmsService.sendSms.mockReset();
  });

  describe('approveAgent', () => {
    it('should throw NotFoundException for invalid agent', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.approveAgent('invalid', 'admin-1', UserRole.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow Admin to move PENDING to APPROVED_BY_ADMIN', async () => {
      const agent = {
        id: 'agent-1',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.PENDING,
        isActive: false,
        user: null,
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockResolvedValue({
        ...agent,
        approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN,
      });
      mockUserRepository.find.mockResolvedValueOnce([]);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      const result = await service.approveAgent('agent-1', 'admin-1', UserRole.ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.APPROVED_BY_ADMIN);
    });

    it('should allow SA to final approve to ACTIVE with SMS', async () => {
      const agent = {
        id: 'agent-1',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN,
        isActive: false,
        plainPassword: 'abc123456',
        user: {
          id: 'user-1',
          role: UserRole.AGENT,
          mobileNumber: '01712345678',
          isActive: false,
        },
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockResolvedValue({
        ...agent,
        approvalStatus: AgentApprovalStatus.ACTIVE,
        isActive: true,
      });
      mockUserRepository.save.mockResolvedValue({ ...agent.user, isActive: true });
      mockSmsService.sendSms.mockResolvedValue(undefined);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      const result = await service.approveAgent('agent-1', 'sa-1', UserRole.SUPER_ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.ACTIVE);
      expect(mockSmsService.sendSms).toHaveBeenCalled();
    });

    it('should reject invalid approval state for Admin', async () => {
      const agent = {
        id: 'agent-1',
        approvalStatus: AgentApprovalStatus.ACTIVE,
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);

      await expect(service.approveAgent('agent-1', 'admin-1', UserRole.ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow SA to approve an owner without a stored password', async () => {
      const agent = {
        id: 'agent-1',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN,
        isActive: false,
        user: {
          role: UserRole.OWNER,
          mobileNumber: '01712345678',
          isActive: false,
        },
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockImplementation(async (value) => value);
      mockUserRepository.save.mockResolvedValue(agent.user);
      mockSmsService.sendSms.mockResolvedValue(undefined);
      mockNotificationService.notifyRoles.mockResolvedValue(undefined);
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      const result = await service.approveAgent('agent-1', 'sa-1', UserRole.SUPER_ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.ACTIVE);
      expect(mockSmsService.sendSms).toHaveBeenCalledWith(
        '01712345678',
        expect.stringContaining('OWNER ID'),
      );
    });

    it('should reject approval by an unsupported role', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({
        id: 'agent-1',
        approvalStatus: AgentApprovalStatus.PENDING,
      });

      await expect(service.approveAgent('agent-1', 'owner-1', UserRole.OWNER)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('requestDeactivation', () => {
    it('should allow SA to deactivate directly', async () => {
      const agent = {
        id: 'agent-1',
        isActive: true,
        approvalStatus: AgentApprovalStatus.ACTIVE,
        user: { isActive: true },
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockResolvedValue({
        ...agent,
        isActive: false,
        approvalStatus: AgentApprovalStatus.DEACTIVATED,
      });
      mockUserRepository.save.mockResolvedValue({ isActive: false });

      const result = await service.requestDeactivation('agent-1', 'sa-1', UserRole.SUPER_ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.DEACTIVATED);
    });

    it('should allow Owner to request deactivation of own agent', async () => {
      const agent = {
        id: 'agent-1',
        parentAgentId: 'owner-agent-uuid',
        approvalStatus: AgentApprovalStatus.ACTIVE,
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockResolvedValue({
        ...agent,
        approvalStatus: AgentApprovalStatus.DEACTIVATION_PENDING,
      });

      const result = await service.requestDeactivation(
        'agent-1',
        'owner-agent-uuid',
        UserRole.OWNER,
      );

      expect(result.approvalStatus).toBe(AgentApprovalStatus.DEACTIVATION_PENDING);
    });

    it('should reject Owner trying to deactivate other agent', async () => {
      const agent = {
        id: 'agent-1',
        parentAgentId: 'different-owner',
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);

      await expect(
        service.requestDeactivation('agent-1', 'owner-agent-uuid', UserRole.OWNER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to request deactivation', async () => {
      const agent = { id: 'agent-1', approvalStatus: AgentApprovalStatus.ACTIVE };
      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockImplementation(async (value) => value);

      const result = await service.requestDeactivation('agent-1', 'admin-1', UserRole.ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.DEACTIVATION_PENDING);
    });

    it('should reject deactivation by an unsupported role', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({ id: 'agent-1' });

      await expect(
        service.requestDeactivation('agent-1', 'member-1', UserRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approveDeactivation', () => {
    it('should allow Admin to approve pending deactivation', async () => {
      const agent = { id: 'agent-1', approvalStatus: AgentApprovalStatus.DEACTIVATION_PENDING };
      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockImplementation(async (value) => value);

      const result = await service.approveDeactivation('agent-1', 'admin-1', UserRole.ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.DEACTIVATION_APPROVED_BY_ADMIN);
    });

    it('should reject deactivation approval by an unsupported role', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({ id: 'agent-1' });

      await expect(
        service.approveDeactivation('agent-1', 'owner-1', UserRole.OWNER),
      ).rejects.toThrow(BadRequestException);
    });

    it('should deactivate an agent without a linked user as SA', async () => {
      const agent = {
        id: 'agent-1',
        approvalStatus: AgentApprovalStatus.DEACTIVATION_APPROVED_BY_ADMIN,
        isActive: true,
        user: null,
      };
      mockAgentRepository.findOne.mockResolvedValueOnce(agent);
      mockAgentRepository.save.mockImplementation(async (value) => value);

      const result = await service.approveDeactivation('agent-1', 'sa-1', UserRole.SUPER_ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.DEACTIVATED);
      expect(result.isActive).toBe(false);
    });
  });

  describe('declineAgent', () => {
    it('should reject a final approval and record the reason', async () => {
      const agent = {
        id: 'agent-1',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN,
        isActive: false,
        user: { isActive: false },
      };
      mockAgentRepository.findOne.mockResolvedValue(agent);
      mockAgentRepository.save.mockResolvedValue({
        ...agent,
        approvalStatus: AgentApprovalStatus.REJECTED,
      });
      mockUserRepository.save.mockResolvedValue(agent.user);

      const result = await service.declineAgent(
        'agent-1',
        'sa-1',
        UserRole.SUPER_ADMIN,
        'Incomplete documents',
      );

      expect(result.approvalStatus).toBe(AgentApprovalStatus.REJECTED);
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AGENT_DECLINED', performedById: 'sa-1' }),
      );
    });

    it('should reject a decline by a non-Super Admin', async () => {
      await expect(service.declineAgent('agent-1', 'admin-1', UserRole.ADMIN)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject declining an agent in the wrong state', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({
        id: 'agent-1',
        approvalStatus: AgentApprovalStatus.ACTIVE,
      });

      await expect(service.declineAgent('agent-1', 'sa-1', UserRole.SUPER_ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('declineDeactivation', () => {
    it('should keep an agent active when final deactivation is declined', async () => {
      const agent = {
        id: 'agent-1',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.DEACTIVATION_APPROVED_BY_ADMIN,
        isActive: true,
        user: { isActive: true },
      };
      mockAgentRepository.findOne.mockResolvedValue(agent);
      mockAgentRepository.save.mockResolvedValue({
        ...agent,
        approvalStatus: AgentApprovalStatus.ACTIVE,
      });
      mockUserRepository.save.mockResolvedValue(agent.user);

      const result = await service.declineDeactivation('agent-1', 'sa-1', UserRole.SUPER_ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.ACTIVE);
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AGENT_DEACTIVATION_DECLINED' }),
      );
    });

    it('should reject declining deactivation by a non-Super Admin', async () => {
      await expect(
        service.declineDeactivation('agent-1', 'admin-1', UserRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject declining deactivation in the wrong state', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({
        id: 'agent-1',
        approvalStatus: AgentApprovalStatus.ACTIVE,
      });

      await expect(
        service.declineDeactivation('agent-1', 'sa-1', UserRole.SUPER_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingApprovals', () => {
    it('should return PENDING for Admin', async () => {
      mockAgentRepository.find.mockResolvedValueOnce([]);
      mockAgentRepository.find.mockResolvedValueOnce([]);

      const result = await service.getPendingApprovals(UserRole.ADMIN);

      expect(result.pendingCreates).toEqual([]);
      expect(result.pendingDeactivations).toEqual([]);
    });

    it('should return APPROVED_BY_ADMIN for SA', async () => {
      mockAgentRepository.find.mockResolvedValueOnce([]);
      mockAgentRepository.find.mockResolvedValueOnce([]);

      const result = await service.getPendingApprovals(UserRole.SUPER_ADMIN);

      expect(result.pendingCreates).toEqual([]);
      expect(result.pendingDeactivations).toEqual([]);
    });

    it('should return empty queries for unsupported roles', async () => {
      mockAgentRepository.find.mockResolvedValueOnce([]);
      mockAgentRepository.find.mockResolvedValueOnce([]);

      await service.getPendingApprovals(UserRole.MEMBER);

      expect(mockAgentRepository.find).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ where: [] }),
      );
      expect(mockAgentRepository.find).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ where: [] }),
      );
    });
  });
});
