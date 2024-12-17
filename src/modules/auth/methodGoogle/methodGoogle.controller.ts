import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { PromiseApiAuthResponse } from '@/src/common/types/apiResponse'
import { TokenDto } from '@/src/dtos'
import { MethodGoogleService } from './methodGoogle.service'

@Controller('auth/google')
export class MethodGoogleController {
  constructor(private readonly methodGoogleService: MethodGoogleService) {}

  @Post('/register')
  @HttpCode(200)
  async authenticationWithGoogle(
    @Body() tokenDto: TokenDto
  ): PromiseApiAuthResponse {
    return await this.methodGoogleService.authenticationWithGoogle(
      tokenDto.idToken
    )
  }
}
