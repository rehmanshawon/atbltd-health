import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HospitalService } from './hospital.service';
import { Hospital } from '../../entities/hospital.entity';
import { Claim } from '../../entities/claim.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';

describe('HospitalService', () => {
  let service: HospitalService;

  const hospitalRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const claimRepository = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
  const auditLogRepository = { save: jest.fn() };
  const claimDocumentRepository = { find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalService,
        { provide: getRepositoryToken(Hospital), useValue: hospitalRepository },
        { provide: getRepositoryToken(Claim), useValue: claimRepository },
        { provide: getRepositoryToken(AuditLog), useValue: auditLogRepository },
        { provide: getRepositoryToken(ClaimDocument), useValue: claimDocumentRepository },
      ],
    }).compile();

    service = module.get<HospitalService>(HospitalService);
    jest.clearAllMocks();
  });

  it('rejects a hospital with a duplicate login ID', async () => {
    hospitalRepository.findOne.mockResolvedValue({ id: 'hospital-1' });

    await expect(
      service.createHospital(
        {
          name: 'ATB Hospital',
          address: 'Dhaka',
          contactNumber: '01712345678',
          loginId: 'atb-hospital',
          password: 'secure-password',
          isPartner: true,
        },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a hospital with a hashed password and audit record', async () => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    hospitalRepository.findOne.mockResolvedValue(null);
    hospitalRepository.create.mockImplementation((hospital) => hospital);
    hospitalRepository.save.mockResolvedValue({
      id: 'hospital-1',
      name: 'ATB Hospital',
      loginId: 'atb-hospital',
      isPartner: true,
    });

    const result = await service.createHospital(
      {
        name: 'ATB Hospital',
        address: 'Dhaka',
        contactNumber: '01712345678',
        loginId: 'atb-hospital',
        password: 'secure-password',
        isPartner: true,
      },
      'admin-1',
    );

    expect(result.id).toBe('hospital-1');
    expect(hospitalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-password', isActive: true }),
    );
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'HOSPITAL_CREATED', performedById: 'admin-1' }),
    );
  });

  it('returns a missing-claim error before changing claim state', async () => {
    claimRepository.findOne.mockResolvedValue(null);

    await expect(
      service.verifyClaim('missing-claim', 'hospital-1', 'verified', 'Reviewed'),
    ).rejects.toThrow(NotFoundException);

    expect(claimRepository.save).not.toHaveBeenCalled();
  });

  it('moves a verified hospital claim back to ATB review and audits it', async () => {
    const claim = { id: 'claim-1', status: ClaimStatus.HOSPITAL_VERIFICATION, notes: null };
    claimRepository.findOne.mockResolvedValue(claim);
    hospitalRepository.findOne.mockResolvedValue({
      id: 'hospital-1',
      name: 'ATB Hospital',
    });
    claimRepository.save.mockResolvedValue(claim);

    const result = await service.verifyClaim(
      'claim-1',
      'hospital-1',
      'verified',
      'Documents confirmed',
    );

    expect(result.status).toBe(ClaimStatus.UNDER_REVIEW);
    expect(result.notes).toBe('Documents confirmed');
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'HOSPITAL_VERIFIED', entityId: 'claim-1' }),
    );
  });
});
