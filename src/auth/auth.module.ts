import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { SmsService } from 'src/sms/sms.service';
import { TwilioModule } from 'nestjs-twilio';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { MethodPhoneModule } from './methodPhone/methodPhone.module';
import { MethodGoogleModule } from './methodGoogle/methodGoogle.module';
import { MethodCredentialsModule } from './methodCredentials/methodCredentials.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expire') || '60s',
        },
      }),
    }),
    TypeOrmModule.forFeature([Usuario]),
    TwilioModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        accountSid: configService.get<string>('twilio.accountSid'),
        authToken: configService.get<string>('twilio.authToken'),
      }),
    }),
    MethodPhoneModule,
    MethodGoogleModule,
    MethodCredentialsModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    UsersService,
    MailService,
    SmsService,
    WhatsappService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
