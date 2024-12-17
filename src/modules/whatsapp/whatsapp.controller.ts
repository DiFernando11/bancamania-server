import { Body, Controller, Post } from '@nestjs/common'
import { WhatsappService } from './whatsapp.service'

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send-code/authentication')
  async sendCode(
    @Body()
    body: {
      phoneNumber: string
    }
  ) {
    const { phoneNumber } = body

    return this.whatsappService.sendVerificationCode(phoneNumber)
  }
}
