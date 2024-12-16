import { Injectable } from '@nestjs/common';
import { Usuario } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { AuthShareService } from '../authShare.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { HttpResponseSuccess, ThrowHttpException } from 'src/common/utils';
import { HttpResponseStatus } from 'src/common/constants';

@Injectable()
export class MethodPhoneService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendCodeToPhone({ phone, code }) {
    try {
      //   const value = await this.whatsappService.sendVerificationCode(phone);
      console.log(phone, code.verificationCode, 'SEND WHATSAPP');
      return code;
    } catch (error) {
      console.log(error, 'ERROR ENVIANDO CODIGO');
      ThrowHttpException(
        'Error al enviar un código a tu teléfono',
        HttpResponseStatus.BAD_REQUEST,
      );
    }
  }
  async sendCodePhone({ phone }) {
    const code = await this.firebaseService.createCode({
      data: { phone, isValidatedCode: false },
      feature: 'authPhone',
    });
    console.log({ code });
    await this.sendCodeToPhone({ phone, code });
    return HttpResponseSuccess(
      'Código de verificación enviado correctamente, revisa tu celular.',
    );
  }

  async validateCodePhone({ code, phone }) {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      phone,
      feature: 'authPhone',
    });
    const isVerify = codeSaved.code === code;

    if (!isVerify) {
      ThrowHttpException(
        'Código no válido, por favor verifica tu código en tu celular',
        HttpResponseStatus.BAD_REQUEST,
      );
    }

    const user = await this.usersService.findByAttribute('phone_number', phone);

    const createPayload = {
      email: user?.email,
      firstName: user?.first_name,
      lastName: user?.last_name,
      phone,
      image: user?.image,
    };

    const isUserRegistered = user?.authMethods?.includes('phone');

    if (isUserRegistered) {
      await this.firebaseService.deleteCodeById(codeSaved.id);
      return {
        message: 'Login exitoso',
        isUserRegistered,
        token: this.authShareService.createToken({
          user: createPayload,
        }),
        user: createPayload,
      };
    }
    await this.firebaseService.updateCodeExpireById(codeSaved.id, 5, {
      isValidatedCode: true,
    });
    return HttpResponseSuccess(
      'Vincula tu dispositivo a tu correo electrónico para continuar.',
      { isUserRegistered },
    );
  }

  async registerWithPhoneGoogle({ phone, idToken }) {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      phone,
      feature: 'authPhone',
    });

    if (!codeSaved.isValidatedCode) {
      ThrowHttpException(
        'Verifica tu celular antes de continuar',
        HttpResponseStatus.BAD_REQUEST,
      );
    }

    const payload = await this.authShareService.verifyGoogleToken(idToken);
    const user = await this.usersService.findByEmail(payload.email);

    if (user?.authMethods?.includes('phone')) {
      ThrowHttpException(
        `El correo electrónico ${payload.email} ya está vinculado al teléfono ${phone}`,
        HttpResponseStatus.BAD_REQUEST,
      );
    }

    const methods = user?.authMethods || [];

    await this.usersService.createOrUpdateUser({
      findAttribute: 'email',
      findValue: payload.email,
      userData: {
        email: payload.email,
        first_name: user?.first_name || payload.given_name,
        last_name: user?.last_name || payload.family_name,
        image: user?.image || payload.picture,
        phone_number: phone,
        authMethods: [...methods, 'phone'],
      },
      existingUser: user,
    });

    await this.firebaseService.deleteCodeById(codeSaved.id);

    const createPayload = {
      email: payload.email,
      firstName: user?.first_name || payload.given_name,
      lastName: user?.last_name || payload.family_name,
      image: user?.image || payload.picture,
      phone,
    };
    return HttpResponseSuccess(
      'Autenticación con celular ejecutada con éxito',
      {
        token: this.authShareService.createToken({ user: createPayload }),
        user: createPayload,
      },
    );
  }
}
