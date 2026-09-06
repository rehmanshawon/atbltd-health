import { Test, TestingModule } from '@nestjs/testing';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';
import { ClaimDocumentService } from './claim-document.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClaimStatus } from '../../common/enums/claim-status.enum';

describe('ClaimController', () => {
  let controller: ClaimController;
  let claimService: ClaimService;
  let claimDocumentService: ClaimDocumentService;

  const mockClaimService = {
    submitClaim: jest.fn(),
    getClaimStats: jest.fn(),
    getMemberClaims: jest.fn(),
    getAllClaims: jest.fn(),
    getClaimById: jest.fn(),
    updateClaimStatus: jest.fn(),
  };

  const mockClaimDocumentService = {
    uploadDocumentsWithTypes: jest.fn(),
    getClaimDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimController],
      providers: [
        { provide: ClaimService, useValue: mockClaimService },
        { provide: ClaimDocumentService, useValue: mockClaimDocumentService },
      ],
    }).compile();

    controller = module.get<ClaimController>(ClaimController);
    claimService = module.get<ClaimService>(ClaimService);
    claimDocumentService = module.get<ClaimDocumentService>(ClaimDocumentService);
    jest.clearAllMocks();
  });

  describe('submitClaim', () => {
    it('calls claimService.submitClaim with user id and DTO', async () => {
      mockClaimService.submitClaim.mockResolvedValue({ id: 'claim-1' });
      const dto = { amount: 1000 } as any;
      const result = await controller.submitClaim({ sub: 'user-1' } as any, dto);
      expect(result).toEqual({ id: 'claim-1' });
      expect(claimService.submitClaim).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('getStats', () => {
    it('calls claimService.getClaimStats', async () => {
      mockClaimService.getClaimStats.mockResolvedValue({ total: 5 });
      const result = await controller.getStats();
      expect(result).toEqual({ total: 5 });
      expect(claimService.getClaimStats).toHaveBeenCalled();
    });
  });

  describe('getMyClaims', () => {
    it('calls claimService.getMemberClaims with user sub', async () => {
      mockClaimService.getMemberClaims.mockResolvedValue([]);
      const result = await controller.getMyClaims({ sub: 'user-1' } as any);
      expect(result).toEqual([]);
      expect(claimService.getMemberClaims).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getAllClaims', () => {
    it('calls claimService.getAllClaims with filters and reviewer role', async () => {
      mockClaimService.getAllClaims.mockResolvedValue({ items: [] });
      const user = { sub: 'admin-1', role: UserRole.ADMIN };
      const result = await controller.getAllClaims(
        user as any,
        1,
        10,
        ClaimStatus.SUBMITTED,
        'mem-1',
      );
      expect(result).toEqual({ items: [] });
      expect(claimService.getAllClaims).toHaveBeenCalledWith({
        status: ClaimStatus.SUBMITTED,
        memberId: 'mem-1',
        page: 1,
        limit: 10,
        reviewerRole: UserRole.ADMIN,
      });
    });
  });

  describe('getClaim', () => {
    it('calls claimService.getClaimById', async () => {
      mockClaimService.getClaimById.mockResolvedValue({ id: 'claim-1' });
      const result = await controller.getClaim('claim-1', {
        sub: 'user-1',
        role: UserRole.MEMBER,
      } as any);
      expect(result).toEqual({ id: 'claim-1' });
      expect(claimService.getClaimById).toHaveBeenCalledWith('claim-1', 'user-1', UserRole.MEMBER);
    });
  });

  describe('updateStatus', () => {
    it('calls claimService.updateClaimStatus', async () => {
      const updateDto = { status: ClaimStatus.APPROVED } as any;
      mockClaimService.updateClaimStatus.mockResolvedValue({
        id: 'claim-1',
        status: ClaimStatus.APPROVED,
      });
      const user = { sub: 'admin-1', role: UserRole.ADMIN };
      const result = await controller.updateStatus('claim-1', user as any, updateDto);
      expect(result.status).toBe(ClaimStatus.APPROVED);
      expect(claimService.updateClaimStatus).toHaveBeenCalledWith(
        'claim-1',
        ClaimStatus.APPROVED,
        'admin-1',
        UserRole.ADMIN,
        updateDto,
      );
    });
  });

  describe('Documents endpoints', () => {
    it('uploads claim documents', async () => {
      const docPayload = {
        documents: [{ documentType: 'BILL', fileName: 'bill.pdf', fileUrl: 'http...' }],
      };
      mockClaimDocumentService.uploadDocumentsWithTypes.mockResolvedValue({ success: true });
      const result = await controller.uploadClaimDocuments(
        'claim-1',
        { sub: 'user-1' } as any,
        docPayload,
      );
      expect(result).toEqual({ success: true });
      expect(claimDocumentService.uploadDocumentsWithTypes).toHaveBeenCalledWith(
        'claim-1',
        'user-1',
        docPayload.documents,
      );
    });

    it('gets claim documents', async () => {
      mockClaimDocumentService.getClaimDocuments.mockResolvedValue([]);
      const result = await controller.getClaimDocuments('claim-1', {
        sub: 'user-1',
        role: UserRole.MEMBER,
      } as any);
      expect(result).toEqual([]);
      expect(claimDocumentService.getClaimDocuments).toHaveBeenCalledWith(
        'claim-1',
        'user-1',
        UserRole.MEMBER,
      );
    });
  });
});
