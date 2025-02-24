import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { I18nService } from 'nestjs-i18n'
import { HttpResponseStatus } from '@/src/common/constants'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { AuthShareService } from '@/src/modules/auth/authShare.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly i18n: I18nService,
    private readonly authShareService: AuthShareService
  ) {}

  async refreshToken(req: Request) {
    const refreshToken = req.cookies['refresh-token-session-id']

    if (!refreshToken) {
      ThrowHttpException(
        this.i18n.t('validationDto.REFRESH_TOKEN_REQUIRED'),
        HttpResponseStatus.UNAUTHORIZED
      )
    }

    const payload = this.authShareService.verifyRefreshToken(refreshToken)

    const newAccessToken = this.authShareService.generateAccessToken({
      email: payload.email,
      id: payload.id,
    })

    return HttpResponseSuccess(this.i18n.t('auth.REFRESH_TOKEN_SUCCESS'), {
      accessToken: newAccessToken,
    })
  }

  getSecureMessage() {
    return HttpResponseSuccess(this.i18n.t('auth.TOKEN_VALID'))
  }
}
