import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiToken: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiToken = process.env.GREENWEB_API_TOKEN || '1234567890123456789'; // Demo token
    this.apiUrl = 'https://api.bdbulksms.net/api.php';
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatBangladeshNumber(to);

      // Use JSON format for better reliability
      const response = await fetch(`${this.apiUrl}?json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.apiToken,
          smsdata: [
            {
              to: formattedNumber,
              message: message,
            },
          ],
        }),
      });

      const data = await response.json();

      // Check for success in both formats
      const successStatuses = [
        'SENT',
        'SUCCESS',
        'SMS_SUBMITTED_SUCCESSFULLY',
        'SMS_SENT_SUCCESSFULLY',
      ];
      if (Array.isArray(data)) {
        const result = data[0];
        if (result && successStatuses.includes(result.status?.toUpperCase())) {
          this.logger.log(`SMS sent to ${to}`);
          return true;
        }
      } else if (
        data?.status &&
        successStatuses.includes(data.status.toUpperCase())
      ) {
        this.logger.log(`SMS sent to ${to}`);
        return true;
      } else if (data?.statusmsg?.toLowerCase().includes('success')) {
        this.logger.log(`SMS sent to ${to}`);
        return true;
      }

      this.logger.error(`Unexpected response: ${JSON.stringify(data)}`);
      return false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`SMS error: ${msg}`);
      return false;
    }
  }

  async sendMembershipActivationSms(
    to: string,
    data: { fullName: string; memberId: string; temporaryPassword: string },
  ): Promise<boolean> {
    const message = `(ATB Ltd) Welcome ${data.fullName}! Member ID: ${data.memberId}. Temp Password: ${data.temporaryPassword}. Login: https://atbltd.health/login`;
    return this.sendSms(to, message);
  }

  async sendPaymentReceivedSms(to: string, memberId: string): Promise<boolean> {
    const message = `ATB Ltd: We received your membership payment. Member ID: ${memberId}. Credentials will follow after verification.`;
    return this.sendSms(to, message);
  }

  async sendClaimStatusSms(
    to: string,
    claimId: string,
    status: string,
  ): Promise<boolean> {
    const message = `ATB Ltd: Your claim (${claimId.substring(
      0,
      8,
    )}) status: ${status.replace(/_/g, ' ').toUpperCase()}.`;
    return this.sendSms(to, message);
  }

  private formatBangladeshNumber(number: string): string {
    // GreenWeb accepts: 01XXXXXXXXX or +8801XXXXXXXXX
    if (number.startsWith('+880')) return number;
    if (number.startsWith('880')) return `+${number}`;
    if (number.startsWith('01')) return number;
    return number;
  }
}
