import { Strategy } from 'passport-jwt'
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        if (!req.cookies) {
          console.error('No cookies found')
          return null
        }

        const token = req.cookies['token-session-id']
        return token
      },
      secretOrKey: 'your_secret_key',
      algorithms: ['HS256'],
    })
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.email }
  }
}
