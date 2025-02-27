import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { AccountController } from '@/src/modules/account/account.controller'
import { Account } from '@/src/modules/account/account.entity'
import { AccountService } from '@/src/modules/account/account.service'
import { Movement } from '@/src/modules/movements/movements.entity'
import { MovementsService } from '@/src/modules/movements/movements.service'
import { UsersService } from '@/src/modules/users/users.service'
import { JwtStrategy } from '../../strategies/jwt.strategy'

@Module({
  controllers: [AccountController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
      }),
    }),
    TypeOrmModule.forFeature([Account]),
    TypeOrmModule.forFeature([Usuario]),
    TypeOrmModule.forFeature([Movement]),
  ],
  providers: [JwtStrategy, AccountService, UsersService, MovementsService],
})
export class AccountModule {}
