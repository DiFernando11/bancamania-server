import { Module } from '@nestjs/common'
import { MethodCredentialsController } from './methodCredentials.controller'
import { MethodCredentialsService } from './methodCredentials.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { AuthShareService } from '../authShare.service'
import { UsersService } from 'src/modules/users/users.service'
import { MailService } from 'src/modules/mail/mail.service'
import { JwtModule } from '@nestjs/jwt'
import { FirebaseService } from 'src/modules/firebase/firebase.service'
import { ConfigService } from '@nestjs/config'

@Module({
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
  controllers: [MethodCredentialsController],
  providers: [
    MethodCredentialsService,
    AuthShareService,
    UsersService,
    MailService,
    FirebaseService,
  ],
})
export class MethodCredentialsModule {}
