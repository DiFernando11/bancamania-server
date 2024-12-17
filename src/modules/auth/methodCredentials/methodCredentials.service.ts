import { Injectable } from '@nestjs/common'
import { UsersService } from 'src/modules/users/users.service'
import { AuthShareService } from '../authShare.service'
import * as bcrypt from 'bcryptjs'
import { MailService } from 'src/modules/mail/mail.service'
import { CreateUserCredentialsDto } from './dto/register.dto'
import { FirebaseService } from 'src/modules/firebase/firebase.service'
import { HttpResponseStatus } from 'src/common/constants'
import { HttpResponseSuccess, ThrowHttpException } from 'src/common/utils'
import { I18nService } from 'nestjs-i18n'

@Injectable()
export class MethodCredentialsService {
  constructor(
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
    private readonly i18n: I18nService
  ) {}

  async sendCodeRegisterCredentials({ email }: { email: string }) {
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
      email,
      code,
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
  }: CreateUserCredentialsDto) {
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
    })

    const createPayload = {
      email,
      firstName: firstName || user?.first_name,
      lastName: lastName || user?.last_name,
      image: user?.image,
      phone: user?.phone_number,
    }

    return HttpResponseSuccess(
      this.i18n.t('auth.REGISTRATION_SUCCESS'),
      {
        token: this.authShareService.createToken({
          user: createPayload,
          expiresIn: '5m',
        }),
        user: createPayload,
      },
      HttpResponseStatus.CREATED
    )
  }

  async loginWithCredentials(email: string, password: string) {
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

    const createPayload = {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      image: user.image,
      phone: user.phone_number,
    }

    return HttpResponseSuccess(this.i18n.t('auth.LOGIN_SUCCESS'), {
      token: this.authShareService.createToken({
        user: createPayload,
      }),
      user: createPayload,
    })
  }
}
