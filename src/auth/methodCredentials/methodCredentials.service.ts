import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthShareService } from '../authShare.service';
import * as bcrypt from 'bcryptjs';
import { MailService } from 'src/mail/mail.service';
import { CreateUserCredentialsDto } from './dto/register.dto';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class MethodCredentialsService {
  constructor(
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendCodeRegisterCredentials({ email }: { email: string }) {
    const user = await this.usersService.findByEmail(email);

    if (user && user?.authMethods?.includes('credentials')) {
      throw new HttpException(
        'Este correo electronico ya esta registrado',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const code = await this.firebaseService.createCode({
      data: { email },
      feature: 'registerCredentials',
    });

    await this.mailService.sendToCodeMail({
      email,
      code,
    });

    return {
      message: `Se ha enviado tu codigo de verificacion al correo ${email}`,
      firstName: user?.first_name,
      lastName: user?.last_name,
    };
  }
  async registerWithCredentials({
    email,
    password,
    firstName,
    lastName,
    code,
  }: CreateUserCredentialsDto) {
    const codeSaved = await this.firebaseService.getCodeByEmailAndFeature({
      email,
      feature: 'registerCredentials',
    });
    const isVerify = codeSaved.code === code;

    if (!isVerify) {
      throw new BadRequestException(
        'Codigo no valido por favor verifica tu codigo en tu correo',
      );
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.usersService.findByEmail(email);

    const methods = user?.authMethods || [];

    await this.usersService.createOrUpdateUser({
      findAttribute: 'email',
      findValue: email,
      userData: {
        email,
        first_name: firstName,
        last_name: lastName,
        password: hashedPassword,
        authMethods: [...methods, 'credentials'],
      },
      existingUser: user,
    });

    const createPayload = {
      email,
      firstName: firstName || user?.first_name,
      lastName: lastName || user?.last_name,
      image: user?.image,
      phone: user?.phone_number,
    };

    return {
      token: this.authShareService.createToken({
        user: createPayload,
        expiresIn: '5m',
      }),
      user: createPayload,
    };
  }

  async loginWithCredentials(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException(
        'Credenciales inválidas. El correo no existe o aun no te has registrado.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'Credenciales inválidas. Contraseña incorrecta.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const createPayload = {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      image: user.image,
      phone: user.phone_number,
    };

    return {
      message: 'Inicio de sesión exitoso.',
      token: this.authShareService.createToken({
        user: createPayload,
      }),
      user: createPayload,
    };
  }
}
