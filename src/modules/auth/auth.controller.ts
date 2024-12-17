import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor() {}

  @Get('secure')
  @UseGuards(JwtAuthGuard)
  getSecureMessage(): string {
    return 'Este es un mensaje seguro solo accesible con un token válido'
  }
}
