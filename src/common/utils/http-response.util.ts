import { HttpException } from '@nestjs/common'
import { HttpResponseStatus } from '../constants/custom-http-status.constant'

export const HttpResponseSuccess = (
  message: string = 'Success',
  data?: any,
  status = HttpResponseStatus.OK
) => ({
  ok: true,
  statusCode: status.code,
  message: message || status.message,
  data: data || null,
})
export const HttpResponseError = (
  message: string,
  status = HttpResponseStatus.BAD_REQUEST,
  error?: any
) => ({
  ok: false,
  statusCode: status.code,
  message: message || status.message,
  error,
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
