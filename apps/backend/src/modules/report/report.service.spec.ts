import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';

describe('ReportService', () => {
  let service: ReportService;

  const mockUserRepository = { count: jest.fn(), find: jest.fn() };
  const mockPaymentRepository = { find: jest.fn() };
  const mockClaimRepository = { find: jest.fn() };
  const mockAgentRepository = { find: jest.fn() };
  const mockAuditLogRepository = { find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(Claim), useValue: mockClaimRepository },
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    jest.clearAllMocks();
  });

  function expectValidPdfBuffer(buffer: Buffer) {
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  }

  describe('generateMemberReport', () => {
    it('produces a PDF summarizing member counts', async () => {
      mockUserRepository.count
        .mockResolvedValueOnce(50) // totalMembers
        .mockResolvedValueOnce(40) // activeMembers
        .mockResolvedValueOnce(3); // newThisMonth
      mockUserRepository.find.mockResolvedValueOnce([
        {
          memberId: 'ATB-001',
          fullName: 'Jane Doe',
          mobileNumber: '01700000000',
          isActive: true,
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const buffer = await service.generateMemberReport('super_admin');

      expectValidPdfBuffer(buffer);
    });

    it('handles an empty member list', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.find.mockResolvedValueOnce([]);

      const buffer = await service.generateMemberReport('admin');

      expectValidPdfBuffer(buffer);
    });
  });

  describe('generatePaymentReport', () => {
    it('produces a PDF summarizing verified payments', async () => {
      mockPaymentRepository.find.mockResolvedValueOnce([
        {
          user: { fullName: 'Jane Doe' },
          method: 'bkash',
          amount: 1000,
          createdAt: new Date('2026-01-01'),
          transactionId: 'TXN1',
        },
      ]);

      const buffer = await service.generatePaymentReport();

      expectValidPdfBuffer(buffer);
      expect(mockPaymentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'verified' } }),
      );
    });
  });

  describe('generateClaimReport', () => {
    it('produces a PDF summarizing claim statuses', async () => {
      mockClaimRepository.find.mockResolvedValueOnce([
        {
          member: { fullName: 'Jane Doe' },
          surgeryType: 'Cardiac Surgery',
          hospitalName: 'ATB Hospital',
          claimedAmount: 8000,
          status: 'approved',
        },
        {
          member: { fullName: 'John Roe' },
          surgeryType: 'Appendectomy',
          hospitalName: 'ATB Hospital',
          claimedAmount: 5000,
          status: 'rejected',
        },
      ]);

      const buffer = await service.generateClaimReport();

      expectValidPdfBuffer(buffer);
    });
  });

  describe('generateAgentReport', () => {
    it('produces a PDF summarizing agent performance', async () => {
      mockAgentRepository.find.mockResolvedValueOnce([
        {
          agentCode: 'ATB-AG-001',
          user: { fullName: 'Agent One' },
          commissionRate: 10,
          totalMembersRegistered: 20,
          totalCommissionEarned: 5000,
          totalCommissionPaid: 3000,
        },
      ]);

      const buffer = await service.generateAgentReport();

      expectValidPdfBuffer(buffer);
    });
  });

  describe('generateAuditReport', () => {
    it('produces a PDF summarizing recent audit log entries', async () => {
      mockAuditLogRepository.find.mockResolvedValueOnce([
        {
          action: 'USER_REGISTERED',
          performedBy: { fullName: 'Jane Doe' },
          entity: 'User',
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const buffer = await service.generateAuditReport();

      expectValidPdfBuffer(buffer);
    });
  });
});
