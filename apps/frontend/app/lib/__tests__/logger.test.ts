import { logger } from '../logger';

describe('logger', () => {
  it('emits a structured JSON error entry', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.error('Request failed', { endpoint: '/claims/123' });

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(JSON.parse(consoleError.mock.calls[0][0])).toEqual(
      expect.objectContaining({
        level: 'error',
        message: 'Request failed',
        context: { endpoint: '/claims/123' },
        timestamp: expect.any(String),
      }),
    );

    consoleError.mockRestore();
  });
});
