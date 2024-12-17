import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FirebaseService } from 'src/modules/firebase/firebase.service'
import { MailService } from 'src/modules/mail/mail.service'
import { Usuario } from 'src/modules/users/users.entity'
import { UsersService } from 'src/modules/users/users.service'
import { AuthShareService } from '../authShare.service'
import { MethodCredentialsController } from './methodCredentials.controller'
import { MethodCredentialsService } from './methodCredentials.service'

@Module({
  controllers: [MethodCredentialsController],
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expire') || '60s',
        },
      }),
    }),
  ],
  providers: [
    MethodCredentialsService,
    AuthShareService,
    UsersService,
    MailService,
    FirebaseService,
  ],
})
export class MethodCredentialsModule {}
