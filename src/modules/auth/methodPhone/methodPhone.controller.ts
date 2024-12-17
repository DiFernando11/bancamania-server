import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import {
  RegisterPhone,
  RegisterPhoneDto,
  // TokenDto,
  ValidatePhoneRegister,
} from '../dto/register.dto'
import { MethodPhoneService } from './methodPhone.service'

@Controller('auth/phone')
export class MethodPhoneController {
  constructor(private readonly methodPhoneService: MethodPhoneService) {}

  @Post('sendCode')
  @HttpCode(200)
  async sendCodePhone(@Body() registerPhoneDto: RegisterPhoneDto) {
    return this.methodPhoneService.sendCodePhone({
      phone: registerPhoneDto.phone,
    })
  }
  @Post('login')
  @HttpCode(200)
  async validateCodePhone(
    @Body() validatePhoneRegister: ValidatePhoneRegister
  ) {
    return this.methodPhoneService.validateCodePhone({
      code: validatePhoneRegister.code,
      phone: validatePhoneRegister.phone,
    })
  }

  @Post('register')
  async registerPhoneToEmail(
    @Body()
    registerPhone: RegisterPhone
  ) {
    return this.methodPhoneService.registerWithPhoneGoogle({
      idToken: registerPhone.idToken,
      phone: registerPhone.phone,
    })
  }
}
