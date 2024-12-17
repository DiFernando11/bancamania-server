import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import {
  PromiseApiAuthResponse,
  PromiseApiResponse,
} from '@/src/common/types/apiResponse'
import { EmailDto } from '@/src/dtos'
import { SendCodeRegister } from '@/src/modules/auth/methodCredentials/types'
import { AuthBaseDto, CreateUserCredentialsDto } from './dto/register.dto'
import { MethodCredentialsService } from './methodCredentials.service'

@Controller('auth/credentials')
export class MethodCredentialsController {
  constructor(
    private readonly methodCredentialsService: MethodCredentialsService
  ) {}

  @Post('sendCode')
  @HttpCode(200)
  async sendCodeRegisterCredentials(
    @Body() createUserDto: EmailDto
  ): PromiseApiResponse<SendCodeRegister> {
    return await this.methodCredentialsService.sendCodeRegisterCredentials({
      email: createUserDto.email,
    })
  }

  @Post('register')
  async registerWithCredentials(
    @Body() createUserDto: CreateUserCredentialsDto
  ): PromiseApiAuthResponse {
    return await this.methodCredentialsService.registerWithCredentials({
      code: createUserDto.code,
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      password: createUserDto.password,
    })
  }

  @Post('login')
  @HttpCode(200)
  async loginWithCredentials(
    @Body() loginDto: AuthBaseDto
  ): PromiseApiAuthResponse {
    return await this.methodCredentialsService.loginWithCredentials({
      email: loginDto.email,
      password: loginDto.password,
    })
  }
}
