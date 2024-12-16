import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthShareService } from '../authShare.service';
import * as bcrypt from 'bcryptjs';
import { MailService } from 'src/mail/mail.service';
import { CreateUserCredentialsDto } from './dto/register.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { HttpResponseStatus } from 'src/common/constants';
import { HttpResponseSuccess, ThrowHttpException } from 'src/common/utils';

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
      ThrowHttpException(
        'Este correo electrónico ya está registrado',
        HttpResponseStatus.UNAUTHORIZED,
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

    return HttpResponseSuccess(
      `Se ha enviado tu código de verificación al correo ${email}`,
      {
        firstName: user?.first_name,
        lastName: user?.last_name,
      },
    );
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
      ThrowHttpException(
        'Código no válido. Por favor, verifica tu código en tu correo',
        HttpResponseStatus.BAD_REQUEST,
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

    return HttpResponseSuccess(
      'Registro exitoso',
      {
        token: this.authShareService.createToken({
          user: createPayload,
          expiresIn: '5m',
        }),
        user: createPayload,
      },
      HttpResponseStatus.CREATED,
    );
  }

  async loginWithCredentials(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      ThrowHttpException(
        'Credenciales inválidas. El correo no existe o aún no te has registrado.',
        HttpResponseStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      ThrowHttpException(
        'Credenciales inválidas. Contraseña incorrecta.',
        HttpResponseStatus.UNAUTHORIZED,
      );
    }

    const createPayload = {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      image: user.image,
      phone: user.phone_number,
    };

    return HttpResponseSuccess('Inicio de sesión exitoso.', {
      token: this.authShareService.createToken({
        user: createPayload,
      }),
      user: createPayload,
    });
  }
}
