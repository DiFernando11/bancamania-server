import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TwilioModule } from 'nestjs-twilio'
import { MailService } from 'src/modules/mail/mail.service'
import { SmsService } from 'src/modules/sms/sms.service'
import { Usuario } from 'src/modules/users/users.entity'
import { UsersService } from 'src/modules/users/users.service'
import { WhatsappService } from 'src/modules/whatsapp/whatsapp.service'
import { JwtStrategy } from '../../strategies/jwt.strategy'
import { AuthController } from './auth.controller'
import { MethodCredentialsModule } from './methodCredentials/methodCredentials.module'
import { MethodGoogleModule } from './methodGoogle/methodGoogle.module'
import { MethodPhoneModule } from './methodPhone/methodPhone.module'

@Module({
  controllers: [AuthController],
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
    JwtStrategy,
    UsersService,
    MailService,
    SmsService,
    WhatsappService,
  ],
})
export class AuthModule {}
