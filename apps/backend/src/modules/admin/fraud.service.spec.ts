import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FraudService } from './fraud.service';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';

function mockQueryBuilder(rawManyResult: unknown[]) {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawManyResult),
  };
}

describe('FraudService', () => {
  let service: FraudService;

  const mockUserRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockPaymentRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockAuditLogRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
    jest.clearAllMocks();
  });

  describe('runFraudChecks', () => {
    it('returns no alerts when nothing suspicious is found', async () => {
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));
      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));
      mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));

      const alerts = await service.runFraudChecks();

      expect(alerts).toEqual([]);
    });

    it('flags duplicate NIDs, duplicate mobiles, rapid registrations and duplicate transactions', async () => {
      // 1st call: duplicate NID check, 2nd call: duplicate mobile check (both on userRepository)
      mockUserRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder([{ user_nid: '123456789', count: '2' }]))
        .mockReturnValueOnce(mockQueryBuilder([{ user_mobileNumber: '01700000000', count: '2' }]));
      mockUserRepository.find.mockResolvedValueOnce([
        { id: 'u1', memberId: 'ATB-001', fullName: 'A', mobileNumber: '01700000000' },
        { id: 'u2', memberId: 'ATB-002', fullName: 'B', mobileNumber: '01700000001' },
      ]);

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([{ log_ipAddress: '10.0.0.1', count: '6' }]),
      );

      mockPaymentRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([{ payment_transactionId: 'TXN1', count: '2' }]),
      );

      const alerts = await service.runFraudChecks();

      expect(alerts).toHaveLength(4);
      expect(alerts.map((a) => a.type)).toEqual([
        'duplicate_nid',
        'duplicate_mobile',
        'rapid_registrations',
        'duplicate_payment',
      ]);
      expect(alerts[0].severity).toBe('high');
      expect(alerts[2].severity).toBe('medium');
    });
  });

  describe('checkUser', () => {
    it('returns no alerts when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      const alerts = await service.checkUser('missing');

      expect(alerts).toEqual([]);
    });

    it('returns no alerts when the user has no NID', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'u1', nid: null });

      const alerts = await service.checkUser('u1');

      expect(alerts).toEqual([]);
    });

    it('flags a user whose NID is shared with other accounts', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'u1', nid: '123456789' });
      mockUserRepository.count.mockResolvedValueOnce(2);

      const alerts = await service.checkUser('u1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'duplicate_nid',
        severity: 'high',
        entityId: 'u1',
      });
    });

    it('does not flag a user whose NID is unique', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 'u1', nid: '123456789' });
      mockUserRepository.count.mockResolvedValueOnce(1);

      const alerts = await service.checkUser('u1');

      expect(alerts).toEqual([]);
    });
  });
});
