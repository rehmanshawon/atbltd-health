import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AgentService } from './agent.service';
import { AgentApprovalService } from './agent-approval.service';
import { Agent, AgentApprovalStatus } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';

describe('AgentService', () => {
  let service: AgentService;
  let approvalService: AgentApprovalService;

  const mockAgentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
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
        AgentService,
        AgentApprovalService,
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    approvalService = module.get<AgentApprovalService>(AgentApprovalService);

    jest.clearAllMocks();
    mockAgentRepository.findOne.mockReset();
    mockAgentRepository.save.mockReset();
    mockAgentRepository.create.mockReset();
    mockAgentRepository.find.mockReset();
    mockAgentRepository.count.mockReset();
    mockUserRepository.findOne.mockReset();
    mockUserRepository.save.mockReset();
    mockUserRepository.create.mockReset();
    mockUserRepository.find.mockReset();
    mockUserRepository.count.mockReset();
    mockAuditLogRepository.save.mockReset();
    mockNotificationService.notifyRoles.mockReset();
    mockNotificationService.notifyUser.mockReset();
    mockSmsService.sendSms.mockReset();
  });

  describe('createAgent', () => {
    it('should create agent as ACTIVE when created by Super Admin', async () => {
      const superAdmin = {
        id: 'sa-uuid',
        memberId: 'ATB-26-SA-1',
        fullName: 'System Administrator',
        role: UserRole.SUPER_ADMIN,
      };

      mockUserRepository.findOne.mockResolvedValueOnce(null); // duplicate mobile check
      mockUserRepository.findOne.mockResolvedValueOnce(superAdmin); // creator lookup
      mockUserRepository.count.mockResolvedValue(2); // agent count
      mockUserRepository.create.mockReturnValue({
        id: 'new-user-uuid',
        memberId: 'ATB-26-AG-3',
        fullName: 'Test Agent',
        mobileNumber: '01712345678',
        role: UserRole.AGENT,
        isActive: true,
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'new-user-uuid',
        memberId: 'ATB-26-AG-3',
        fullName: 'Test Agent',
        mobileNumber: '01712345678',
        role: UserRole.AGENT,
        isActive: true,
      });

      mockAgentRepository.findOne.mockResolvedValueOnce({
        id: 'parent-uuid',
        agentCode: 'ATB-26-OW-1',
        isActive: true,
      });
      mockAgentRepository.create.mockReturnValue({
        id: 'agent-uuid',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.ACTIVE,
        isActive: true,
      });
      mockAgentRepository.save.mockResolvedValue({
        id: 'agent-uuid',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.ACTIVE,
        isActive: true,
      });

      const result = await service.createAgent(
        {
          fullName: 'Test Agent',
          mobileNumber: '01712345678',
          role: UserRole.AGENT,
          commissionRate: 10,
          parentAgentCode: 'ATB-26-OW-1',
        },
        'sa-uuid',
      );

      expect(result.agent.approvalStatus).toBe(AgentApprovalStatus.ACTIVE);
      expect(result.agent.isActive).toBe(true);
    });

    it('should create agent as APPROVED_BY_ADMIN when created by Admin', async () => {
      const admin = {
        id: 'admin-uuid',
        memberId: 'ATB-26-AD-1',
        fullName: 'Finance Director',
        role: UserRole.ADMIN,
      };

      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.findOne.mockResolvedValueOnce(admin);
      mockUserRepository.count.mockResolvedValue(1);
      mockUserRepository.create.mockReturnValue({ id: 'new-user' });
      mockUserRepository.save.mockResolvedValue({ id: 'new-user' });

      mockAgentRepository.findOne.mockResolvedValueOnce(null);
      mockAgentRepository.create.mockReturnValue({
        id: 'agent-uuid',
        approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN,
        isActive: false,
      });
      mockAgentRepository.save.mockResolvedValue({
        id: 'agent-uuid',
        approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN,
        isActive: false,
      });

      const result = await service.createAgent(
        {
          fullName: 'Test Owner',
          mobileNumber: '01712345679',
          role: UserRole.OWNER,
          commissionRate: 5,
        },
        'admin-uuid',
      );

      expect(result.agent.approvalStatus).toBe(AgentApprovalStatus.APPROVED_BY_ADMIN);
      expect(result.agent.isActive).toBe(false);
    });

    it('should create agent as PENDING when created by Owner', async () => {
      const owner = {
        id: 'owner-uuid',
        memberId: 'ATB-26-OW-1',
        fullName: 'Test Owner',
        role: UserRole.OWNER,
      };

      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.findOne.mockResolvedValueOnce(owner);
      mockUserRepository.count.mockResolvedValue(2);
      mockUserRepository.create.mockReturnValue({ id: 'new-user' });
      mockUserRepository.save.mockResolvedValue({ id: 'new-user' });

      mockAgentRepository.findOne.mockResolvedValueOnce({
        id: 'parent-uuid',
        agentCode: 'ATB-26-OW-1',
        isActive: true,
      });
      mockAgentRepository.create.mockReturnValue({
        id: 'agent-uuid',
        approvalStatus: AgentApprovalStatus.PENDING,
        isActive: false,
      });
      mockAgentRepository.save.mockResolvedValue({
        id: 'agent-uuid',
        approvalStatus: AgentApprovalStatus.PENDING,
        isActive: false,
      });

      const result = await service.createAgent(
        {
          fullName: 'Test Agent',
          mobileNumber: '01712345680',
          role: UserRole.AGENT,
          commissionRate: 10,
          parentAgentCode: 'ATB-26-OW-1',
        },
        'owner-uuid',
      );

      expect(result.agent.approvalStatus).toBe(AgentApprovalStatus.PENDING);
      expect(result.agent.isActive).toBe(false);
    });

    it('should throw BadRequestException when agent has no parent', async () => {
      await expect(
        service.createAgent(
          {
            fullName: 'Test Agent',
            mobileNumber: '01712345681',
            role: UserRole.AGENT,
            commissionRate: 10,
          },
          'admin-uuid',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate mobile', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'existing-user',
        mobileNumber: '01712345678',
      });

      await expect(
        service.createAgent(
          {
            fullName: 'Test Agent',
            mobileNumber: '01712345678',
            role: UserRole.OWNER,
            commissionRate: 5,
          },
          'admin-uuid',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('approveAgent', () => {
    it('should allow Admin to move PENDING to APPROVED_BY_ADMIN', async () => {
      const agent = {
        id: 'agent-uuid',
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

      const result = await approvalService.approveAgent('agent-uuid', 'admin-uuid', UserRole.ADMIN);

      expect(result.approvalStatus).toBe(AgentApprovalStatus.APPROVED_BY_ADMIN);
    });

    it('should allow SA to final approve APPROVED_BY_ADMIN to ACTIVE', async () => {
      const agent = {
        id: 'agent-uuid',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.APPROVED_BY_ADMIN,
        isActive: false,
        user: {
          id: 'user-uuid',
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
      mockUserRepository.find.mockResolvedValueOnce([]);

      const result = await approvalService.approveAgent(
        'agent-uuid',
        'sa-uuid',
        UserRole.SUPER_ADMIN,
      );

      expect(result.approvalStatus).toBe(AgentApprovalStatus.ACTIVE);
      expect(result.isActive).toBe(true);
    });

    it('should reject invalid approval state', async () => {
      const agent = {
        id: 'agent-uuid',
        agentCode: 'ATB-26-AG-3',
        approvalStatus: AgentApprovalStatus.ACTIVE,
        isActive: true,
      };

      mockAgentRepository.findOne.mockResolvedValueOnce(agent);

      await expect(
        approvalService.approveAgent('agent-uuid', 'admin-uuid', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingApprovals', () => {
    it('should return PENDING items for Admin', async () => {
      mockAgentRepository.find.mockResolvedValueOnce([]);
      mockAgentRepository.find.mockResolvedValueOnce([]);

      const result = await approvalService.getPendingApprovals(UserRole.ADMIN);

      expect(result.pendingCreates).toEqual([]);
      expect(result.pendingDeactivations).toEqual([]);
    });

    it('should return APPROVED_BY_ADMIN items for SA', async () => {
      mockAgentRepository.find.mockResolvedValueOnce([]);
      mockAgentRepository.find.mockResolvedValueOnce([]);

      const result = await approvalService.getPendingApprovals(UserRole.SUPER_ADMIN);

      expect(result.pendingCreates).toEqual([]);
      expect(result.pendingDeactivations).toEqual([]);
    });
  });
});
