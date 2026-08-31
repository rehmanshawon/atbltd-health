import { BadRequestException } from '@nestjs/common';
import { PaymentRoutingService } from './payment-routing.service';

describe('PaymentRoutingService', () => {
  const originalBkashNumber = process.env.BKASH_MERCHANT_NUMBER;
  let service: PaymentRoutingService;

  beforeEach(() => {
    service = new PaymentRoutingService();
  });

  afterEach(() => {
    if (originalBkashNumber === undefined) {
      delete process.env.BKASH_MERCHANT_NUMBER;
    } else {
      process.env.BKASH_MERCHANT_NUMBER = originalBkashNumber;
    }
  });

  it('returns the configured official recipient account', () => {
    process.env.BKASH_MERCHANT_NUMBER = '01700000000';

    expect(service.getRecipientAccount('bkash')).toBe('01700000000');
  });

  it('rejects an unsupported payment method', () => {
    expect(() => service.getRecipientAccount('paypal')).toThrow(BadRequestException);
  });
});
