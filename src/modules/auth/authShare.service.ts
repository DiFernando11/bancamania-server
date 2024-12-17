import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { OAuth2Client } from 'google-auth-library'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AuthShareService {
  private client: OAuth2Client
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.client = new OAuth2Client(
      this.configService.get<string>('googleAuth.clientId')
    )
  }

  generateSendCode() {
    const verificationCode = uuidv4().slice(0, 6)
    const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000)

    return {
      verificationCode,
      verificationExpiresAt,
    }
  }

  verifyCodeRegister(code: string, user): Promise<any> {
    if (!user) {
      throw new BadRequestException('Usuario no encontrado')
    }

    // Verifica si el código de verificación coincide
    if (user.verificationCode !== code) {
      throw new BadRequestException('Código de verificación incorrecto')
    }

    // Verifica si el código ha expirado
    if (new Date() > user.verificationExpiresAt) {
      throw new BadRequestException('El código de verificación ha expirado')
    }

    return user
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

  verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token)

      return decoded
    } catch (error) {
      console.error('Token inválido verifyToken:', error.message)
      throw new BadRequestException('Token inválido')
    }
  }

  createToken({ user, expiresIn = '5m' }) {
    const token = this.jwtService.sign(
      {
        email: user.email,
        firstName: user?.first_name || user?.firstName,
        image: user?.image,
        isVerifyPhone: true,
        lastName: user?.last_name || user?.lastName,
        phone: user?.phone || user?.phone_number,
      },
      {
        expiresIn,
      }
    )

    return token
  }
}
