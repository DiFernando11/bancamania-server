import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from '@/src/modules/auth/auth.service'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    return this.authService.refreshToken(req)
  }

  @Get('validateToken')
  @UseGuards(JwtAuthGuard)
  getSecureMessage() {
    return this.authService.getSecureMessage()
  }
}
