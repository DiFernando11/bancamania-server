import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FirebaseService } from 'src/modules/firebase/firebase.service'
import { Usuario } from 'src/modules/users/users.entity'
import { UsersService } from 'src/modules/users/users.service'
import { AuthShareService } from '../authShare.service'
import { MethodPhoneController } from './methodPhone.controller'
import { MethodPhoneService } from './methodPhone.service'

@Module({
  controllers: [MethodPhoneController],
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
    MethodPhoneService,
    AuthShareService,
    UsersService,
    FirebaseService,
  ],
})
export class MethodPhoneModule {}
