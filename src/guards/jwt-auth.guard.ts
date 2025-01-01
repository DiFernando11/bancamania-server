import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { HttpResponseStatus } from '@/src/common/constants'
import { ThrowHttpException } from '@/src/common/utils'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      ThrowHttpException(null, HttpResponseStatus.UNAUTHORIZED, {
        isTokenExpired: true,
      })
    }
    return user
  }
}
