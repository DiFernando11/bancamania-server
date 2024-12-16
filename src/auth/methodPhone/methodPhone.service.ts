import { Injectable, BadRequestException } from '@nestjs/common';
import { Usuario } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { AuthShareService } from '../authShare.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { FirebaseService } from 'src/firebase/firebase.service';

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
      throw new BadRequestException('Error al enviar un codigo a tu telefono');
    }
  }
  async sendCodePhone({ phone }) {
    const code = await this.firebaseService.createCode({
      data: { phone, isValidatedCode: false },
      feature: 'authPhone',
    });
    console.log({ code });
    await this.sendCodeToPhone({ phone, code });
    return {
      message:
        'Codigo de verificacion Enviado correctamente, revisa tu celular',
    };
  }

  async validateCodePhone({ code, phone }) {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      phone,
      feature: 'authPhone',
    });
    const isVerify = codeSaved.code === code;

    if (!isVerify) {
      throw new BadRequestException(
        'Codigo no valido por favor verifica tu codigo en tu celular',
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
    return {
      message: 'Vincula tu dispositivo a tu correo electronico para continuar',
      isUserRegistered,
    };
  }

  async registerWithPhoneGoogle({ phone, idToken }) {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      phone,
      feature: 'authPhone',
    });

    if (!codeSaved.isValidatedCode) {
      throw new BadRequestException(`Verifica tu celuar antes de continuar`);
    }

    const payload = await this.authShareService.verifyGoogleToken(idToken);
    const user = await this.usersService.findByEmail(payload.email);

    if (user?.authMethods?.includes('phone')) {
      throw new BadRequestException(
        `El correo electronico ${payload.email} se encuentra vinculado al telefono con numero ${phone}}`,
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
    return {
      message: 'Authenticacion con celular ejecutada con exito',
      token: this.authShareService.createToken({ user: createPayload }),
      user: createPayload,
    };
  }
}
