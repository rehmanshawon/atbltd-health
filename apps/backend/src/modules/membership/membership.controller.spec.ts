import { Test, TestingModule } from '@nestjs/testing';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';

describe('MembershipController', () => {
  let controller: MembershipController;
  let service: MembershipService;

  const mockMembershipService = {
    getMemberDashboard: jest.fn(),
    getMembershipStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipController],
      providers: [{ provide: MembershipService, useValue: mockMembershipService }],
    }).compile();

    controller = module.get<MembershipController>(MembershipController);
    service = module.get<MembershipService>(MembershipService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get member dashboard', async () => {
    mockMembershipService.getMemberDashboard.mockResolvedValue({
      id: 'dash-1',
      digitalCard: { cardNo: '123' },
    });
    const result = await controller.getDashboard({ sub: 'user-1' } as any);
    expect(result.digitalCard).toEqual({ cardNo: '123' });
    expect(service.getMemberDashboard).toHaveBeenCalledWith('user-1');
  });

  it('should get membership status', async () => {
    mockMembershipService.getMembershipStatus.mockResolvedValue({ active: true });
    const result = await controller.getStatus({ sub: 'user-1' } as any);
    expect(result).toEqual({ active: true });
    expect(service.getMembershipStatus).toHaveBeenCalledWith('user-1');
  });

  it('should get digital card from dashboard data', async () => {
    mockMembershipService.getMemberDashboard.mockResolvedValue({
      digitalCard: { cardNumber: 'CARD-99' },
    });
    const result = await controller.getDigitalCard({ sub: 'user-1' } as any);
    expect(result).toEqual({ cardNumber: 'CARD-99' });
  });
});
