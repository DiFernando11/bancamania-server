import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('secure')
  @UseGuards(JwtAuthGuard)
  getSecureMessage(): string {
    return 'Este es un mensaje seguro solo accesible con un token válido';
  }
}
