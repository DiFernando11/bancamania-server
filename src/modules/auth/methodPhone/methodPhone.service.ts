import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { PromiseApiResponse } from '@/src/common/types'
import { PromiseApiAuthResponse } from '@/src/common/types/apiResponse'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { AuthShareService } from '@/src/modules/auth/authShare.service'
import {
  Phone,
  RegisterWithPhoneGoogle,
  SendCodeToPhone,
  ValidateCode,
} from '@/src/modules/auth/methodPhone/types'
import { FirebaseService } from '@/src/modules/firebase/firebase.service'
import { Usuario } from '@/src/modules/users/users.entity'
import { UsersService } from '@/src/modules/users/users.service'

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

  async sendCodeToPhone({ phone, code }: SendCodeToPhone) {
    try {
      /* eslint-disable no-console */
      console.log(phone, code, 'SEND WHATSAPP')

      return code
    } catch (error) {
      console.error(error, 'ERROR ENVIANDO CODIGO')

      ThrowHttpException(
        this.i18n.t('auth.SEND_CODE_ERROR'),
        HttpResponseStatus.BAD_REQUEST
      )
    }
  }

  async sendCodePhone({ phone }: Phone): PromiseApiResponse<null> {
    const code = await this.firebaseService.createCode({
      data: { isValidatedCode: false, phone },
      feature: 'authPhone',
    })

    await this.sendCodeToPhone({ code, phone })

    return HttpResponseSuccess(this.i18n.t('auth.VERIFICATION_CODE_SENT'))
  }

  async validateCodePhone({
    code,
    phone,
  }: SendCodeToPhone): PromiseApiResponse<ValidateCode> {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      feature: 'authPhone',
      phone,
    })

    const isVerify = codeSaved.code === code

    if (!isVerify) {
      ThrowHttpException(
        this.i18n.t('auth.INVALID_VERIFICATION_CODE'),
        HttpResponseStatus.BAD_REQUEST
      )
    }

    const user = await this.usersService.findByAttribute('phone_number', phone)

    const userData = {
      email: user?.email,
      firstName: user?.first_name,
      id: user?.id,
      image: user?.image,
      lastName: user?.last_name,
      phone,
    }

    const isUserRegistered = user?.authMethods?.includes('phone')

    if (isUserRegistered) {
      await this.firebaseService.deleteCodeById(codeSaved.id)

      return this.authShareService.authenticatedResponse({
        restResponse: { isUserRegistered },
        userData,
      })
    }

    await this.firebaseService.updateCodeExpireById(codeSaved.id, 5, {
      isValidatedCode: true,
    })

    return HttpResponseSuccess(this.i18n.t('auth.LINK_PHONE_EMAIL'), {
      isUserRegistered: false,
    })
  }

  async registerWithPhoneGoogle({
    phone,
    idToken,
  }: RegisterWithPhoneGoogle): PromiseApiAuthResponse {
    const codeSaved = await this.firebaseService.getCodeByPhoneAndFeature({
      feature: 'authPhone',
      phone,
    })

    if (!codeSaved.isValidatedCode) {
      ThrowHttpException(
        this.i18n.t('auth.PHONE_NOT_VERIFIED'),
        HttpResponseStatus.BAD_REQUEST
      )
    }

    const payload = await this.authShareService.verifyGoogleToken(idToken)
    const user = await this.usersService.findByEmail(payload.email)

    if (user?.authMethods?.includes('phone')) {
      ThrowHttpException(
        this.i18n.t('auth.PHONE_ALREADY_REGISTERED', {
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

    const userData = {
      email: payload.email,
      firstName: user?.first_name || payload.given_name,
      id: user?.id,
      image: user?.image || payload.picture,
      lastName: user?.last_name || payload.family_name,
      phone,
    }

    return this.authShareService.authenticatedResponse({
      message: 'auth.REGISTRATION_SUCCESS',
      statusCode: HttpResponseStatus.CREATED,
      userData,
    })
  }
}
