import { HttpException } from '@nestjs/common';
import { HttpResponseStatus } from '../constants/custom-http-status.constant';

export const HttpResponseSuccess = (
  message: string = 'Success',
  data?: any,
  status = HttpResponseStatus.OK,
) => ({
  statusCode: status.code,
  message: message || status.message,
  data: data || null,
});
export const HttpResponseError = (
  message: string,
  status = HttpResponseStatus.BAD_REQUEST,
) => ({
  statusCode: status.code,
  message: message || status.message,
  error: status.message,
});

export const ThrowHttpException = (
  message: string,
  status = HttpResponseStatus.BAD_REQUEST,
) => {
  throw new HttpException(HttpResponseError(message, status), status.code);
};
