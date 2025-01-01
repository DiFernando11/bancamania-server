import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { UsersService } from 'src/modules/users/users.service'
import { AuthShareService } from '../authShare.service'
import { MethodGoogleController } from './methodGoogle.controller'
import { MethodGoogleService } from './methodGoogle.service'

@Module({
  controllers: [MethodGoogleController],
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
      }),
    }),
  ],
  providers: [MethodGoogleService, AuthShareService, UsersService],
})
export class MethodGoogleModule {}
