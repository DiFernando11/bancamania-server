import { HttpException } from '@nestjs/common'
import { HttpResponseStatus } from '../constants/custom-http-status.constant'

export const HttpResponseSuccess = (
  message: string = 'Success',
  data?: any,
  status = HttpResponseStatus.OK
) => ({
  data: data || null,
  message: message || status.message,
  ok: true,
  statusCode: status.code,
})
export const HttpResponseError = (
  message: string,
  status = HttpResponseStatus.BAD_REQUEST,
  error?: any
) => ({
  error,
  message: message || status.message,
  ok: false,
  statusCode: status.code,
})

export const ThrowHttpException = (
  message: string,
  status = HttpResponseStatus.BAD_REQUEST,
  error?: any
) => {
  throw new HttpException(
    HttpResponseError(message, status, error),
    status.code
  )
}
