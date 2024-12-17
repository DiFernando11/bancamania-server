import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      auth: {
        pass: this.configService.get<string>('sendEmail.passAuth'),
        user: this.configService.get<string>('sendEmail.userAuth'),
      },
      host: this.configService.get<string>('sendEmail.host'),
      port: this.configService.get<number>('sendEmail.port'),
      secure: this.configService.get<boolean>('sendEmail.secure'),
    })
  }

  async sendMail({
    email,
    subject,
    text,
    html,
  }: {
    email: string
    subject: string
    text: string
    html: string
  }) {
    await this.transporter.sendMail({
      from: `"Diego Apolo 👻" <${this.configService.get<string>('sendEmail.userAuth')}>`,
      html,
      subject,
      text,
      to: email,
    })
  }

  async sendToCodeMail({ email, code }) {
    return await this.sendMail({
      email,
      html: `Tu código de verificación es: <b><span style="font-size: 24px;">${code}</span></b>`,
      subject: 'Verifica tu codigo',
      text: `Tu codigo de verificacion es: ${code}`,
    })
  }
}
