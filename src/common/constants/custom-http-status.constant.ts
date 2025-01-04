import { HttpStatus } from '@nestjs/common'

const HttpResponseStatusSuccess = {
  // 201 Created
  CREATED: { code: HttpStatus.CREATED, message: 'Resource Created' },
  // 200 OK
  OK: { code: HttpStatus.OK, message: 'Success' },
}

const HttpResponseStatusError = {
  // 400 Bad Request
  BAD_REQUEST: { code: HttpStatus.BAD_REQUEST, message: 'Bad Request' },

  // 403 Forbidden
  FORBIDDEN: { code: HttpStatus.FORBIDDEN, message: 'Forbidden' },

  // 500 Internal Server Error
  INTERNAL_SERVER_ERROR: {
    code: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal Server Error',
  },

  // 404 Not Found
  NOT_FOUND: { code: HttpStatus.NOT_FOUND, message: 'Not Found' },

  // 204 No Content
  NO_CONTENT: { code: HttpStatus.NO_CONTENT, message: 'No Content' },

  // 401 Unauthorized
  UNAUTHORIZED: { code: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' },

  // 422 Unprocessable Entity
  UNPROCESSABLE_ENTITY: {
    code: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Unprocessable Entity',
  },
}

export const HttpResponseStatus = {
  ...HttpResponseStatusSuccess,
  ...HttpResponseStatusError,
}
