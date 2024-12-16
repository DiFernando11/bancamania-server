import { Module } from '@nestjs/common';
import { MethodPhoneController } from './methodPhone.controller';
import { MethodPhoneService } from './methodPhone.service';
import { AuthShareService } from '../authShare.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { FirebaseService } from 'src/firebase/firebase.service';
import { ConfigService } from '@nestjs/config';

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
  controllers: [MethodPhoneController],
  providers: [
    MethodPhoneService,
    AuthShareService,
    UsersService,
    FirebaseService,
  ],
})
export class MethodPhoneModule {}
