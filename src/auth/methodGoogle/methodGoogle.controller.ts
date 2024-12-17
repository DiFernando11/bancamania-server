import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MethodGoogleService } from './methodGoogle.service';

@Controller('auth/google')
export class MethodGoogleController {
  constructor(private readonly methodGoogleService: MethodGoogleService) {}

  @Post('/register')
  @HttpCode(200)
  async authenticationWithGoogle(
    @Body('idToken') idToken: string,
  ): Promise<{ jwt: string }> {
    return await this.methodGoogleService.authenticationWithGoogle(idToken);
  }
}
