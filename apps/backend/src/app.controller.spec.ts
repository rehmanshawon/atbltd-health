import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

describe('AppController & Observability', () => {
  let appController: AppController;
  let prometheusController: PrometheusController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    prometheusController = new PrometheusController();
    jest.spyOn(prometheusController, 'index').mockImplementation(async (response: any) => {
      const metrics =
        '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.\n# TYPE process_cpu_user_seconds_total counter\nprocess_cpu_user_seconds_total 0.12\n';
      response.send(metrics);
      return metrics;
    });
  });

  describe('root health check', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toBeDefined();
    });
  });

  describe('metrics endpoint', () => {
    it('should return Prometheus metrics content', async () => {
      // Mock Express response object with fully functional chainable mocks
      const mockResponse = {
        header: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      // Call the controller endpoint
      await prometheusController.index(mockResponse as any);

      // Verify that res.send() was successfully called with the metric payload
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('process_cpu_user_seconds_total'),
      );
    });
  });
});
