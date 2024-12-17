import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { EmailDto } from '../dto/register.dto'
import { CreateUserCredentialsDto, LoginDto } from './dto/register.dto'
import { MethodCredentialsService } from './methodCredentials.service'

@Controller('auth/credentials')
export class MethodCredentialsController {
  constructor(
    private readonly methodCredentialsService: MethodCredentialsService
  ) {}

  @Post('sendCode')
  @HttpCode(200)
  async sendCodeRegisterCredentials(@Body() createUserDto: EmailDto) {
    return await this.methodCredentialsService.sendCodeRegisterCredentials({
      email: createUserDto.email,
    })
  }

  @Post('register')
  async registerWithCredentials(
    @Body() createUserDto: CreateUserCredentialsDto
  ) {
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
  async loginWithCredentials(@Body() loginDto: LoginDto) {
    return await this.methodCredentialsService.loginWithCredentials(
      loginDto.email,
      loginDto.password
    )
  }
}
