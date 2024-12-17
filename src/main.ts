import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ThrowHttpException } from './common/utils';
import { HttpResponseStatus } from './common/constants';
import { I18nService } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const i18n: I18nService = app.get(I18nService);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints).map((message) =>
            String(i18n.t(`validationDto.${message}`)),
          ),
        }));
        ThrowHttpException(
          String(i18n.t('validationDto.VALIDATION_FAILED')),
          HttpResponseStatus.BAD_REQUEST,
          formattedErrors,
        );
      },
    }),
  );

  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });
  const port = configService.get<number>('app.port');
  console.log('LISTEN:', port);
  await app.listen(port || 3000);
}
bootstrap();
