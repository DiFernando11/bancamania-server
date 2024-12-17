import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { HttpResponseStatus } from 'src/common/constants/custom-http-status.constant'
import {
  HttpResponseSuccess,
  ThrowHttpException,
} from 'src/common/utils/http-response.util'
import { FirebaseService } from 'src/modules/firebase/firebase.service'
import { Usuario } from 'src/modules/users/users.entity'
import { UsersService } from 'src/modules/users/users.service'
import { Repository } from 'typeorm'
import { AuthShareService } from '../authShare.service'

@Injectable()
export class MethodPhoneService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
    private readonly firebaseService: FirebaseService,
    private readonly i18n: I18nService
  ) {}

  async sendCodeToPhone({ phone, code }) {
    try {
      /* eslint-disable no-console */
      console.log(phone, code.verificationCode, 'SEND WHATSAPP')

      return code
    } catch (error) {
      console.error(error, 'ERROR ENVIANDO CODIGO')

      ThrowHttpException(
        this.i18n.t('phone.SEND_CODE_ERROR'),
        HttpResponseStatus.BAD_REQUEST
      )
    }
  }

  async sendCodePhone({ phone }) {
    const code = await this.firebaseService.createCode({
      data: { isValidatedCode: false, phone },
      feature: 'authPhone',
    })

    await this.sendCodeToPhone({ code, phone })

    return HttpResponseSuccess(this.i18n.t('phone.VERIFICATION_CODE_SENT'))
  }

  async validateCodePhone({ code, phone }) {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      feature: 'authPhone',
      phone,
    })

    const isVerify = codeSaved.code === code

    if (!isVerify) {
      ThrowHttpException(
        this.i18n.t('phone.INVALID_VERIFICATION_CODE'),
        HttpResponseStatus.BAD_REQUEST
      )
    }

    const user = await this.usersService.findByAttribute('phone_number', phone)

    const createPayload = {
      email: user?.email,
      firstName: user?.first_name,
      image: user?.image,
      lastName: user?.last_name,
      phone,
    }

    const isUserRegistered = user?.authMethods?.includes('phone')

    if (isUserRegistered) {
      await this.firebaseService.deleteCodeById(codeSaved.id)

      return HttpResponseSuccess(this.i18n.t('phone.LOGIN_SUCCESS'), {
        isUserRegistered,
        token: this.authShareService.createToken({ user: createPayload }),
        user: createPayload,
      })
    }

    await this.firebaseService.updateCodeExpireById(codeSaved.id, 5, {
      isValidatedCode: true,
    })

    return HttpResponseSuccess(this.i18n.t('phone.LINK_PHONE_EMAIL'), {
      isUserRegistered,
    })
  }

  async registerWithPhoneGoogle({ phone, idToken }) {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      feature: 'authPhone',
      phone,
    })

    if (!codeSaved.isValidatedCode) {
      ThrowHttpException(
        this.i18n.t('phone.PHONE_NOT_VERIFIED'),
        HttpResponseStatus.BAD_REQUEST
      )
    }

    const payload = await this.authShareService.verifyGoogleToken(idToken)
    const user = await this.usersService.findByEmail(payload.email)

    if (user?.authMethods?.includes('phone')) {
      ThrowHttpException(
        this.i18n.t('phone.PHONE_ALREADY_REGISTERED', {
          args: { email: payload.email, phone },
        }),
        HttpResponseStatus.BAD_REQUEST
      )
    }

    const methods = user?.authMethods || []

    await this.usersService.createOrUpdateUser({
      existingUser: user,
      findAttribute: 'email',
      findValue: payload.email,
      userData: {
        authMethods: [...methods, 'phone'],
        email: payload.email,
        first_name: user?.first_name || payload.given_name,
        image: user?.image || payload.picture,
        last_name: user?.last_name || payload.family_name,
        phone_number: phone,
      },
    })

    await this.firebaseService.deleteCodeById(codeSaved.id)

    const createPayload = {
      email: payload.email,
      firstName: user?.first_name || payload.given_name,
      image: user?.image || payload.picture,
      lastName: user?.last_name || payload.family_name,
      phone,
    }

    return HttpResponseSuccess(
      this.i18n.t('phone.REGISTRATION_SUCCESS'),
      {
        token: this.authShareService.createToken({ user: createPayload }),
        user: createPayload,
      },
      HttpResponseStatus.CREATED
    )
  }
}
