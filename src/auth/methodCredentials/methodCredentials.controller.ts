import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MethodCredentialsService } from './methodCredentials.service';
import { CreateUserCredentialsDto, LoginDto } from './dto/register.dto';
import { EmailDto } from '../dto/register.dto';

@Controller('auth/credentials')
export class MethodCredentialsController {
  constructor(
    private readonly methodCredentialsService: MethodCredentialsService,
  ) {}

  @Post('sendCode')
  @HttpCode(200)
  async sendCodeRegisterCredentials(@Body() createUserDto: EmailDto) {
    return await this.methodCredentialsService.sendCodeRegisterCredentials({
      email: createUserDto.email,
    });
  }

  @Post('register')
  async registerWithCredentials(
    @Body() createUserDto: CreateUserCredentialsDto,
  ) {
    return await this.methodCredentialsService.registerWithCredentials({
      email: createUserDto.email,
      password: createUserDto.password,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      code: createUserDto.code,
    });
  }

  @Post('login')
  @HttpCode(200)
  async loginWithCredentials(@Body() loginDto: LoginDto) {
    return await this.methodCredentialsService.loginWithCredentials(
      loginDto.email,
      loginDto.password,
    );
  }
}
