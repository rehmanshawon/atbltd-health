import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  describe('hospitalLogin', () => {
    it('throws UnauthorizedException if hospital not found', async () => {
      hospitalRepository.findOne.mockResolvedValue(null);
      await expect(service.hospitalLogin('invalid', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password does not match', async () => {
      hospitalRepository.findOne.mockResolvedValue({ id: 'h1', password: 'hashed' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service.hospitalLogin('login', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('returns an access token on successful login', async () => {
      hospitalRepository.findOne.mockResolvedValue({
        id: 'h1',
        name: 'Test Hosp',
        loginId: 'login',
        password: 'hashed',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.hospitalLogin('login', 'pass');
      expect(result.hospital.id).toBe('h1');
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('getHospitalClaims', () => {
    it('returns claims in HOSPITAL_VERIFICATION status', async () => {
      claimRepository.find.mockResolvedValue([{ id: 'claim-1' }]);
      const result = await service.getHospitalClaims('h1');
      expect(result).toEqual([{ id: 'claim-1' }]);
      expect(claimRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ClaimStatus.HOSPITAL_VERIFICATION },
        }),
      );
    });
  });

  describe('verifyClaim', () => {
    it('returns a missing-claim error before changing claim state', async () => {
      claimRepository.findOne.mockResolvedValue(null);
      await expect(
        service.verifyClaim('missing-claim', 'hospital-1', 'verified', 'Reviewed'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if hospital does not exist', async () => {
      claimRepository.findOne.mockResolvedValue({ id: 'claim-1' });
      hospitalRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyClaim('claim-1', 'invalid', 'verified', 'notes')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('moves a verified hospital claim back to ATB review and audits it', async () => {
      const claim = {
        id: 'claim-1',
        status: ClaimStatus.HOSPITAL_VERIFICATION,
        notes: null,
        rejectionReason: null,
      };
      claimRepository.findOne.mockResolvedValue(claim);
      hospitalRepository.findOne.mockResolvedValue({ id: 'hospital-1', name: 'ATB Hospital' });
      claimRepository.save.mockResolvedValue({ ...claim, status: ClaimStatus.UNDER_REVIEW });

      const result = await service.verifyClaim(
        'claim-1',
        'hospital-1',
        'verified',
        'Documents confirmed',
      );
      expect(result.status).toBe(ClaimStatus.UNDER_REVIEW);
      expect(auditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'HOSPITAL_VERIFIED' }),
      );
    });

    it('rejects a claim and updates the rejection reason', async () => {
      const claim = {
        id: 'claim-1',
        status: ClaimStatus.HOSPITAL_VERIFICATION,
        notes: null,
        rejectionReason: null,
      };
      claimRepository.findOne.mockResolvedValue(claim);
      hospitalRepository.findOne.mockResolvedValue({ id: 'hospital-1', name: 'ATB Hospital' });
      claimRepository.save.mockResolvedValue({ ...claim, status: ClaimStatus.REJECTED });

      const result = await service.verifyClaim(
        'claim-1',
        'hospital-1',
        'rejected',
        'Fraud detected',
      );
      expect(result.status).toBe(ClaimStatus.REJECTED);
      expect(claim.rejectionReason).toContain('Fraud detected');
    });
  });

  describe('getClaimDocuments', () => {
    it('throws NotFoundException if claim is not found and unassigned', async () => {
      claimRepository.findOne.mockResolvedValue(null);
      await expect(service.getClaimDocuments('claim-1', 'h1')).rejects.toThrow(NotFoundException);
    });

    it('returns documents for a found claim', async () => {
      claimRepository.findOne.mockResolvedValue({ id: 'claim-1' });
      claimDocumentRepository.find.mockResolvedValue([{ id: 'doc-1' }]);
      const result = await service.getClaimDocuments('claim-1', 'h1');
      expect(result).toEqual([{ id: 'doc-1' }]);
    });
  });

  describe('Admin Operations', () => {
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
      hospitalRepository.create.mockImplementation((h) => h);
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
    });

    it('gets all hospitals', async () => {
      hospitalRepository.find.mockResolvedValue([{ id: 'h1' }]);
      const result = await service.getAllHospitals();
      expect(result).toEqual([{ id: 'h1' }]);
    });

    it('deactivates a hospital and audits it', async () => {
      hospitalRepository.findOne.mockResolvedValue({ id: 'h1', isActive: true });
      hospitalRepository.save.mockResolvedValue({ id: 'h1', isActive: false });

      await service.deactivateHospital('h1', 'admin-1');
      expect(hospitalRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(auditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'HOSPITAL_DEACTIVATED' }),
      );
    });

    it('throws NotFoundException when deactivating a non-existent hospital', async () => {
      hospitalRepository.findOne.mockResolvedValue(null);
      await expect(service.deactivateHospital('invalid', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
