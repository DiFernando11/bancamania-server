import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { I18nService } from 'nestjs-i18n'
import { HttpResponseStatus } from '@/src/common/constants'
import { PromiseApiResponse } from '@/src/common/types'
import { PromiseApiAuthResponse } from '@/src/common/types/apiResponse'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { AuthShareService } from '@/src/modules/auth/authShare.service'
import {
  Email,
  LoginCredentials,
  RegisterCredentials,
  SendCodeRegister,
} from '@/src/modules/auth/methodCredentials/types'
import { FirebaseService } from '@/src/modules/firebase/firebase.service'
import { MailService } from '@/src/modules/mail/mail.service'
import { UsersService } from '@/src/modules/users/users.service'

@Injectable()
export class MethodCredentialsService {
  constructor(
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
    private readonly i18n: I18nService
  ) {}

  async sendCodeRegisterCredentials({
    email,
  }: Email): PromiseApiResponse<SendCodeRegister> {
    const user = await this.usersService.findByEmail(email)

    if (user && user?.authMethods?.includes('credentials')) {
      ThrowHttpException(
        this.i18n.t('auth.EMAIL_ALREADY_REGISTERED', { args: { email } }),
        HttpResponseStatus.UNAUTHORIZED
      )
    }

    const code = await this.firebaseService.createCode({
      data: { email },
      feature: 'registerCredentials',
    })

    await this.mailService.sendToCodeMail({
      code,
      email,
    })

    return HttpResponseSuccess(
      this.i18n.t('auth.VERIFICATION_CODE_MAIL_SENT', { args: { email } }),
      {
        firstName: user?.first_name,
        lastName: user?.last_name,
      }
    )
  }

  async registerWithCredentials({
    email,
    password,
    firstName,
    lastName,
    code,
  }: RegisterCredentials): PromiseApiAuthResponse {
    const codeSaved = await this.firebaseService.getCodeByEmailAndFeature({
      email,
      feature: 'registerCredentials',
    })

    const isVerify = codeSaved.code === code

    if (!isVerify) {
      ThrowHttpException(
        this.i18n.t('auth.INVALID_CODE'),
        HttpResponseStatus.BAD_REQUEST
      )
    }

    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await this.usersService.findByEmail(email)
    const methods = user?.authMethods || []

    await this.usersService.createOrUpdateUser({
      existingUser: user,
      findAttribute: 'email',
      findValue: email,
      userData: {
        authMethods: [...methods, 'credentials'],
        email,
        first_name: firstName,
        last_name: lastName,
        password: hashedPassword,
      },
    })

    const userData = {
      email,
      firstName: firstName || user?.first_name,
      image: user?.image,
      lastName: lastName || user?.last_name,
      phone: user?.phone_number,
    }

    return this.authShareService.authenticatedResponse({
      message: 'auth.REGISTRATION_SUCCESS',
      statusCode: HttpResponseStatus.CREATED,
      userData,
    })
  }

  async loginWithCredentials({
    email,
    password,
  }: LoginCredentials): PromiseApiAuthResponse {
    const user = await this.usersService.findByEmail(email)

    if (!user) {
      ThrowHttpException(
        this.i18n.t('auth.CRED_LOGIN_MAIL_INVALID'),
        HttpResponseStatus.UNAUTHORIZED
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      ThrowHttpException(
        this.i18n.t('auth.INVALID_CREDENTIALS'),
        HttpResponseStatus.UNAUTHORIZED
      )
    }

    const userData = {
      email: user.email,
      firstName: user.first_name,
      image: user.image,
      lastName: user.last_name,
      phone: user.phone_number,
    }

    return this.authShareService.authenticatedResponse({ userData })
  }
}
