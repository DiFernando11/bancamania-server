import { Controller, Post, Body, HttpCode } from '@nestjs/common'
import { MethodPhoneService } from './methodPhone.service'
import {
  RegisterPhone,
  RegisterPhoneDto,
  // TokenDto,
  ValidatePhoneRegister,
} from '../dto/register.dto'

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
      phone: validatePhoneRegister.phone,
      code: validatePhoneRegister.code,
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
