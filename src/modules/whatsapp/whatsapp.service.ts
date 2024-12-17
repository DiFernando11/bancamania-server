import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

@Injectable()
export class WhatsappService {
  private readonly graphApiUrl: string
  private readonly phoneNumberId: string
  private readonly accessToken: string

  constructor(private readonly configService: ConfigService) {
    this.graphApiUrl = this.configService.get<string>('whatsapp.graphApiUrl')

    this.phoneNumberId = this.configService.get<string>('whatsapp.phoneId')

    this.accessToken = this.configService.get<string>('whatsapp.accessToken')
  }

  async sendVerificationCode(to: string): Promise<any> {
    const url = `${this.graphApiUrl}/${this.phoneNumberId}/messages`

    const payload = {
      messaging_product: 'whatsapp',
      template: {
        language: {
          code: 'en_US',
        },
        name: 'hello_world',
      },
      to,
      type: 'template',
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      return response.data
    } catch (error) {
      console.error(
        'Error sending WhatsApp message:',
        error.response?.data || error.message
      )
      throw new HttpException(
        error.response?.data || 'Failed to send WhatsApp message',
        HttpStatus.BAD_REQUEST
      )
    }
  }
}
