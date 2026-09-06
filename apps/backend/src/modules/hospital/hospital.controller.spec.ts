import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';

describe('HospitalController', () => {
  let controller: HospitalController;
  let service: HospitalService;

  const mockHospitalService = {
    hospitalLogin: jest.fn(),
    getHospitalClaims: jest.fn(),
    getClaimDocuments: jest.fn(),
    verifyClaim: jest.fn(),
    getAllHospitals: jest.fn(),
    createHospital: jest.fn(),
    deactivateHospital: jest.fn(),
  };

  const validTokenPayload = JSON.stringify({ hospitalId: 'hospital-1' });
  const validToken = Buffer.from(validTokenPayload).toString('base64');
  const validAuthHeader = `Bearer ${validToken}`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalController],
      providers: [{ provide: HospitalService, useValue: mockHospitalService }],
    }).compile();

    controller = module.get<HospitalController>(HospitalController);
    service = module.get<HospitalService>(HospitalService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call hospitalLogin on the service', async () => {
      mockHospitalService.hospitalLogin.mockResolvedValue({ accessToken: 'token' });
      const result = await controller.login({ loginId: 'test', password: 'password' });
      expect(result).toEqual({ accessToken: 'token' });
      expect(service.hospitalLogin).toHaveBeenCalledWith('test', 'password');
    });
  });

  describe('getClaims', () => {
    it('should throw UnauthorizedException if no token is provided', async () => {
      await expect(controller.getClaims('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is invalid base64', async () => {
      await expect(controller.getClaims('Bearer invalid-json-string')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call getHospitalClaims with decoded hospitalId', async () => {
      mockHospitalService.getHospitalClaims.mockResolvedValue([]);
      const result = await controller.getClaims(validAuthHeader);
      expect(result).toEqual([]);
      expect(service.getHospitalClaims).toHaveBeenCalledWith('hospital-1');
    });
  });

  describe('getClaimDocuments', () => {
    it('should throw UnauthorizedException if no token is provided', async () => {
      await expect(controller.getClaimDocuments('claim-1', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call getClaimDocuments with claimId and decoded hospitalId', async () => {
      mockHospitalService.getClaimDocuments.mockResolvedValue([]);
      const result = await controller.getClaimDocuments('claim-1', validAuthHeader);
      expect(result).toEqual([]);
      expect(service.getClaimDocuments).toHaveBeenCalledWith('claim-1', 'hospital-1');
    });
  });

  describe('verifyClaim', () => {
    it('should throw UnauthorizedException if no token is provided', async () => {
      await expect(
        controller.verifyClaim('claim-1', '', { decision: 'verified', notes: 'ok' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call verifyClaim with correct payload', async () => {
      mockHospitalService.verifyClaim.mockResolvedValue({ id: 'claim-1' });
      const result = await controller.verifyClaim('claim-1', validAuthHeader, {
        decision: 'verified',
        notes: 'looks good',
      });
      expect(result).toEqual({ id: 'claim-1' });
      expect(service.verifyClaim).toHaveBeenCalledWith(
        'claim-1',
        'hospital-1',
        'verified',
        'looks good',
      );
    });
  });

  describe('Admin Routes', () => {
    it('should call getAllHospitals', async () => {
      mockHospitalService.getAllHospitals.mockResolvedValue([]);
      const result = await controller.getAllHospitals();
      expect(result).toEqual([]);
      expect(service.getAllHospitals).toHaveBeenCalled();
    });

    it('should call createHospital', async () => {
      mockHospitalService.createHospital.mockResolvedValue({ id: 'new-hosp' });
      const user = {
        sub: 'admin-1',
        email: 'admin@test.com',
        roles: [],
        memberId: 'admin-1',
        role: 'admin',
        mobileNumber: '5555555555',
      };
      const body = { name: 'Test' };
      const result = await controller.createHospital(user, body);
      expect(result).toEqual({ id: 'new-hosp' });
      expect(service.createHospital).toHaveBeenCalledWith(body, 'admin-1');
    });

    it('should call deactivateHospital', async () => {
      mockHospitalService.deactivateHospital.mockResolvedValue(undefined);
      const user = {
        sub: 'admin-1',
        email: 'admin@test.com',
        roles: [],
        memberId: 'admin-1',
        role: 'admin',
        mobileNumber: '5555555555',
      };
      await controller.deactivate('hospital-1', user);
      expect(service.deactivateHospital).toHaveBeenCalledWith('hospital-1', 'admin-1');
    });
  });
});
