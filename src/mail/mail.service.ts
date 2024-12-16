import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('sendEmail.host'),
      port: this.configService.get<number>('sendEmail.port'),
      secure: this.configService.get<boolean>('sendEmail.secure'),
      auth: {
        user: this.configService.get<string>('sendEmail.userAuth'),
        pass: this.configService.get<string>('sendEmail.passAuth'),
      },
    });
  }

  async sendMail({
    email,
    subject,
    text,
    html,
  }: {
    email: string;
    subject: string;
    text: string;
    html: string;
  }) {
    await this.transporter.sendMail({
      from: `"Diego Apolo 👻" <${this.configService.get<string>('sendEmail.userAuth')}>`,
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendToCodeMail({ email, code }) {
    return await this.sendMail({
      email,
      subject: 'Verifica tu codigo',
      text: `Tu codigo de verificacion es: ${code}`,
      html: `Tu código de verificación es: <b><span style="font-size: 24px;">${code}</span></b>`,
    });
  }
}
