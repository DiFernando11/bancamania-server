import { Injectable } from '@nestjs/common';
import { TwilioService } from 'nestjs-twilio';

@Injectable()
export class SmsService {
  constructor(private readonly twilioService: TwilioService) {}

  async sendSmsCode({ to, code }) {
    const message = await this.twilioService.client.messages.create({
      body: `Tu codigo de verificacion es: ${code}`,
      from: '+12029493029',
      to,
    });
    return message.sid;
  }
}
