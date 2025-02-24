import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { OAuth2Client } from 'google-auth-library'
import { I18nService } from 'nestjs-i18n'
import { HttpResponseStatus } from '@/src/common/constants'
import { ClientUser } from '@/src/common/types'
import { HttpResponseSuccess, ThrowHttpException } from '@/src/common/utils'
import { globalConfig } from '@/src/config/global.config'

@Injectable()
export class AuthShareService {
  private client: OAuth2Client
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService
  ) {
    this.client = new OAuth2Client(
      this.configService.get<string>('googleAuth.clientId')
    )
  }

  verifyRefreshToken(refreshToken) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.secretKeyRefreshToken'),
      })
      return payload
    } catch (error) {
      console.error(error)
      ThrowHttpException(
        'Refresh token is caducated',
        HttpResponseStatus.UNAUTHORIZED
      )
    }
  }

  generateAccessToken(data: ClientUser): string {
    const payload = this.jwtService.sign(data, {
      expiresIn: globalConfig.expireInAccesToken,
    })
    return payload
  }

  generateRefreshToken(data: ClientUser): string {
    const payload = this.jwtService.sign(data, {
      expiresIn: globalConfig.expireInRefreshToken,
      secret: this.configService.get<string>('jwt.secretKeyRefreshToken'),
    })
    return payload
  }
  authenticatedResponse({
    userData,
    statusCode,
    restResponse,
    message,
  }: {
    userData: ClientUser
    message?: string
    statusCode?: { code: HttpStatus; message: string }
    restResponse?: object
  }) {
    const messageI18n = message ?? 'auth.LOGIN_SUCCESS'
    return HttpResponseSuccess(
      this.i18n.t(messageI18n),
      {
        refreshToken: this.generateRefreshToken({
          email: userData.email,
          id: userData.id,
        }),
        token: this.generateAccessToken({
          email: userData.email,
          id: userData.id,
        }),
        user: userData,
        ...(restResponse || {}),
      },
      statusCode
    )
  }

  async verifyGoogleToken(idToken) {
    try {
      const ticket = await this.client.verifyIdToken({
        audience: this.configService.get<string>('googleAuth.clientId'),
        idToken,
      })

      const payload = ticket.getPayload()

      const currentTime = Math.floor(Date.now() / 1000)
      const minutesMaxExpired = 60 * 5
      if (currentTime - payload.iat > minutesMaxExpired) {
        throw new BadRequestException('Token expirado')
      }

      return payload
    } catch (error) {
      console.error(error, 'ERROR EN verifyGoogleToken')
      throw new BadRequestException('Token inválido')
    }
  }
}
