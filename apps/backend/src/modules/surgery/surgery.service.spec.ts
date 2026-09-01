import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SurgeryService } from './surgery.service';
import { Surgery } from '../../entities/surgery.entity';

describe('SurgeryService', () => {
  let service: SurgeryService;

  const mockSurgeryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurgeryService,
        { provide: getRepositoryToken(Surgery), useValue: mockSurgeryRepository },
      ],
    }).compile();

    service = module.get<SurgeryService>(SurgeryService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('queries only active surgeries by default', async () => {
      mockSurgeryRepository.find.mockResolvedValueOnce([]);

      await service.findAll();

      expect(mockSurgeryRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC', nameEn: 'ASC' },
      });
    });

    it('adds the isCovered filter when coveredOnly is true', async () => {
      mockSurgeryRepository.find.mockResolvedValueOnce([]);

      await service.findAll(true);

      expect(mockSurgeryRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, isCovered: true },
        order: { sortOrder: 'ASC', nameEn: 'ASC' },
      });
    });

    it('returns the surgeries found by the repository', async () => {
      const surgeries = [{ id: 's1', nameEn: 'Appendectomy' }];
      mockSurgeryRepository.find.mockResolvedValueOnce(surgeries);

      const result = await service.findAll();

      expect(result).toEqual(surgeries);
    });
  });

  describe('findById', () => {
    it('returns the surgery when found', async () => {
      const surgery = { id: 's1', nameEn: 'Appendectomy' };
      mockSurgeryRepository.findOne.mockResolvedValueOnce(surgery);

      const result = await service.findById('s1');

      expect(mockSurgeryRepository.findOne).toHaveBeenCalledWith({ where: { id: 's1' } });
      expect(result).toEqual(surgery);
    });

    it('returns null when the surgery does not exist', async () => {
      mockSurgeryRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });
});
