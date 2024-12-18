import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthShareService } from '@/src/modules/auth/authShare.service'
import { MethodPhoneController } from '@/src/modules/auth/methodPhone/methodPhone.controller'
import { MethodPhoneService } from '@/src/modules/auth/methodPhone/methodPhone.service'
import { FirebaseService } from '@/src/modules/firebase/firebase.service'
import { Usuario } from '@/src/modules/users/users.entity'
import { UsersService } from '@/src/modules/users/users.service'

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
