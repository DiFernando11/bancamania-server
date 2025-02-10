// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      algorithms: ['HS256'],
      jwtFromRequest: (req: Request) => {
        if (!req.cookies) {
          console.error('No cookies found')
          return null
        }
        return req.cookies['token-session-id']
      },
      secretOrKey: configService.get<string>('jwt.secretKey'),
    })
  }

  async validate(payload: any) {
    return payload
  }
}
