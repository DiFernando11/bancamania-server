import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import { I18nService } from 'nestjs-i18n'
import formatValidateErrorsDto from '@/src/common/utils/formatValidateErrorsDto'
import { AppModule } from './app.module'
import { HttpResponseStatus } from './common/constants'
import { ThrowHttpException } from './common/utils'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const i18n: I18nService = app.get(I18nService)

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const formattedErrors = formatValidateErrorsDto(errors, i18n)

        ThrowHttpException(
          i18n.t('validationDto.VALIDATION_FAILED'),
          HttpResponseStatus.BAD_REQUEST,
          formattedErrors
        )
      },
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    })
  )

  app.use(cookieParser())

  app.enableCors({
    credentials: true,
    methods: 'GET,POST,PUT,DELETE',
    origin: 'http://localhost:3000',
  })

  const port = configService.get<number>('app.port')
  await app.listen(port || 3000)
}

bootstrap()
