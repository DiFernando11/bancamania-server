import { HttpStatus } from '@nestjs/common';

export const HttpResponseStatus = {
  // Respuestas exitosas
  OK: { code: HttpStatus.OK, message: 'Success' }, // 200
  CREATED: { code: HttpStatus.CREATED, message: 'Resource Created' }, // 201
  NO_CONTENT: { code: HttpStatus.NO_CONTENT, message: 'No Content' }, // 204

  // Errores del cliente
  BAD_REQUEST: { code: HttpStatus.BAD_REQUEST, message: 'Bad Request' }, // 400
  UNAUTHORIZED: { code: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' }, // 401
  FORBIDDEN: { code: HttpStatus.FORBIDDEN, message: 'Forbidden' }, // 403
  NOT_FOUND: { code: HttpStatus.NOT_FOUND, message: 'Not Found' }, // 404
  UNPROCESSABLE_ENTITY: {
    code: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Unprocessable Entity',
  }, // 422

  // Errores del servidor
  INTERNAL_SERVER_ERROR: {
    code: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal Server Error',
  }, // 500
};
