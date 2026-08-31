import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PaymentRoutingService {
  getRecipientAccount(paymentMethod: string): string {
    const recipientAccount = this.getOfficialAccounts()[paymentMethod];

    if (!recipientAccount) {
      throw new BadRequestException(
        `Invalid payment method: ${paymentMethod}. Allowed: bkash, nagad, rocket, bank`,
      );
    }

    return recipientAccount;
  }

  private getOfficialAccounts(): Record<string, string> {
    return {
      bkash: process.env.BKASH_MERCHANT_NUMBER || '01XXXXXXXXX',
      nagad: process.env.NAGAD_MERCHANT_NUMBER || '01XXXXXXXXX',
      rocket: process.env.ROCKET_MERCHANT_NUMBER || '01XXXXXXXXX',
      bank: process.env.BANK_ACCOUNT || 'ATB-OFFICIAL-BANK-ACCOUNT',
    };
  }
}
