import { Module } from '@nestjs/common'
import { MethodGoogleController } from './methodGoogle.controller'
import { MethodGoogleService } from './methodGoogle.service'
import { UsersService } from 'src/modules/users/users.service'
import { AuthShareService } from '../authShare.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { JwtModule } from '@nestjs/jwt'
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
  controllers: [MethodGoogleController],
  providers: [MethodGoogleService, AuthShareService, UsersService],
})
export class MethodGoogleModule {}
