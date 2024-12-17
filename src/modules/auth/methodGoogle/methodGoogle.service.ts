import { Injectable } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { HttpResponseStatus } from '@/src/common/constants'
import { PromiseApiAuthResponse } from '@/src/common/types/apiResponse'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { UsersService } from '@/src/modules/users/users.service'
import { AuthShareService } from '../authShare.service'

@Injectable()
export class MethodGoogleService {
  constructor(
    private readonly authShareService: AuthShareService,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService
  ) {}

  async authenticationWithGoogle(idToken: string): PromiseApiAuthResponse {
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
        existingUser: userFind,
        findAttribute: 'email',
        findValue: payload.email,
        userData: {
          authMethods: [...methods, 'google'],
          email: payload.email,
          first_name: userFind?.first_name || payload.given_name,
          image: userFind?.image || payload.picture,
          last_name: userFind?.last_name || payload.family_name,
        },
      })
    }

    const createPayload = {
      email: payload.email,
      firstName: userFind?.first_name || payload.given_name,
      image: userFind?.image || payload.picture,
      lastName: userFind?.last_name || payload.family_name,
      phone: userFind?.phone_number,
    }

    return HttpResponseSuccess(this.i18n.t('auth.GOOGLE_AUTH_SUCCESS'), {
      token: this.authShareService.createToken({ user: createPayload }),
      user: createPayload,
    })
  }
}
