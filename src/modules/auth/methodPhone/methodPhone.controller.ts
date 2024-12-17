import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { PromiseApiResponse } from '@/src/common/types'
import { PromiseApiAuthResponse } from '@/src/common/types/apiResponse'
import { PhoneDto } from '@/src/dtos'
import { ValidateCode } from '@/src/modules/auth/methodPhone/types'
import { RegisterPhone, ValidatePhoneRegister } from '../dto/register.dto'
import { MethodPhoneService } from './methodPhone.service'

@Controller('auth/phone')
export class MethodPhoneController {
  constructor(private readonly methodPhoneService: MethodPhoneService) {}

  @Post('sendCode')
  @HttpCode(200)
  async sendCodePhone(
    @Body() registerPhoneDto: PhoneDto
  ): PromiseApiResponse<null> {
    return this.methodPhoneService.sendCodePhone({
      phone: registerPhoneDto.phone,
    })
  }
  @Post('login')
  @HttpCode(200)
  async validateCodePhone(
    @Body() validatePhoneRegister: ValidatePhoneRegister
  ): PromiseApiResponse<ValidateCode> {
    return this.methodPhoneService.validateCodePhone({
      code: validatePhoneRegister.code,
      phone: validatePhoneRegister.phone,
    })
  }

  @Post('register')
  async registerPhoneToEmail(
    @Body()
    registerPhone: RegisterPhone
  ): PromiseApiAuthResponse {
    return this.methodPhoneService.registerWithPhoneGoogle({
      idToken: registerPhone.idToken,
      phone: registerPhone.phone,
    })
  }
}
