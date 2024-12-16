import {
  Injectable,
  // HttpException,
  // HttpStatus,
  BadRequestException,
  // HttpException,
  // HttpStatus,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { Usuario } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private client: OAuth2Client;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {
    // Instancia el cliente de OAuth2Client dentro del constructor
    this.client = new OAuth2Client(
      this.configService.get<string>('googleAuth.clientId'),
    );
  }
  // Método para validar al usuario con su nombre de usuario y contraseña
  // async loginWithCredentials(
  //   username: string,
  //   hashPassword: string,
  // ): Promise<any> {
  //   const user = await this.usersService.findByEmail(username);
  //   if (!user) {
  //     throw new HttpException(
  //       'Correo electrónico no válido',
  //       HttpStatus.UNAUTHORIZED,
  //     );
  //   }
  //   const isPassword = await bcrypt.compare(hashPassword, user.password);
  //   if (!isPassword) {
  //     throw new HttpException('Contraseña no valida', HttpStatus.UNAUTHORIZED);
  //   }
  //   return user;
  // }

  // Método para generar un token JWT
  async login(user: any) {
    // Definir el payload del JWT (qué datos se incluirán en el token)
    const payload = { email: user.email, sub: user.id };

    // Generar el token usando el servicio de JWT
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  generateSendCode() {
    const verificationCode = uuidv4().slice(0, 6);
    const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    return {
      verificationCode,
      verificationExpiresAt,
    };
  }

  async sendCodeEmail({ email }) {
    const code = this.generateSendCode();

    await this.mailService.sendToCodeMail({
      email,
      code: code.verificationCode,
    });

    return code;
  }

  verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      console.error('Token inválido verifyToken:', error.message);
      throw new BadRequestException('Token inválido');
    }
  }
}
