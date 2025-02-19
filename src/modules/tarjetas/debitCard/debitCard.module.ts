import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { DebitCardController } from '@/src/modules/tarjetas/debitCard/debitCard.controller'
import { DebitCard } from '@/src/modules/tarjetas/debitCard/debitCard.entity'
import { DebitCardService } from '@/src/modules/tarjetas/debitCard/debitCard.service'
import { TarjetasService } from '@/src/modules/tarjetas/tarjetas.service'
import { UsersService } from '@/src/modules/users/users.service'
import { JwtStrategy } from '@/src/strategies/jwt.strategy'

@Module({
  controllers: [DebitCardController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
      }),
    }),
    TypeOrmModule.forFeature([DebitCard]),
    TypeOrmModule.forFeature([Usuario]),
  ],
  providers: [JwtStrategy, DebitCardService, UsersService, TarjetasService],
})
export class DebitCardModule {}
