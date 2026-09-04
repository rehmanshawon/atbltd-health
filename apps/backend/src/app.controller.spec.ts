import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

describe('AppController & Observability', () => {
  let appController: AppController;
  let prometheusController: PrometheusController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController, PrometheusController],
      providers: [
        AppService,
        {
          provide: 'PROM_REGISTRY',
          useValue: {
            metrics: jest
              .fn()
              .mockResolvedValue(
                '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.\n',
              ),
            contentType: 'text/plain; version=0.0.4; charset=utf-8',
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    prometheusController = app.get<PrometheusController>(PrometheusController);
  });

  describe('root health check', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toBeDefined();
    });
  });

  describe('metrics endpoint', () => {
    it('should return Prometheus metrics content', async () => {
      const response = {
        end: jest.fn(),
        setHeader: jest.fn(),
      };

      await prometheusController.index(response as any);

      expect(response.end).toHaveBeenCalledWith(
        expect.stringContaining('process_cpu_user_seconds_total'),
      );
    });
  });
});
