import { Injectable } from '@nestjs/common'
import { AuthShareService } from '../authShare.service'
import { UsersService } from 'src/modules/users/users.service'
import {
  HttpResponseSuccess,
  ThrowHttpException,
} from 'src/common/utils/http-response.util'
import { HttpResponseStatus } from 'src/common/constants/custom-http-status.constant'
import { I18nService } from 'nestjs-i18n'

@Injectable()
export class MethodGoogleService {
  constructor(
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService
  ) {}

  async authenticationWithGoogle(idToken: string): Promise<any> {
    const payload = await this.authShareService.verifyGoogleToken(idToken)

    if (!payload) {
      ThrowHttpException(
        this.i18n.t('auth.INVALID_GOOGLE_TOKEN'),
        HttpResponseStatus.UNAUTHORIZED
      )
    }

    const userFind = await this.usersService.findByEmail(payload.email)
    const methods = userFind?.authMethods || []

    if (!userFind?.authMethods?.includes('google')) {
      await this.usersService.createOrUpdateUser({
        findAttribute: 'email',
        findValue: payload.email,
        userData: {
          email: payload.email,
          first_name: userFind?.first_name || payload.given_name,
          last_name: userFind?.last_name || payload.family_name,
          image: userFind?.image || payload.picture,
          authMethods: [...methods, 'google'],
        },
        existingUser: userFind,
      })
    }

    const createPayload = {
      email: payload.email,
      firstName: userFind?.first_name || payload.given_name,
      lastName: userFind?.last_name || payload.family_name,
      phone: userFind?.phone_number,
      image: userFind?.image || payload.picture,
    }

    return HttpResponseSuccess(this.i18n.t('auth.GOOGLE_AUTH_SUCCESS'), {
      token: this.authShareService.createToken({ user: createPayload }),
      user: createPayload,
    })
  }
}
