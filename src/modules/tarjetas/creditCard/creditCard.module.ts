import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { MovementsService } from '@/src/modules/movements/movements.service'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { ReceiptsService } from '@/src/modules/receipts/receipts.service'
import { CreditCardController } from '@/src/modules/tarjetas/creditCard/creditCard.controller'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { CreditCardService } from '@/src/modules/tarjetas/creditCard/creditCard.service'
import { TarjetasService } from '@/src/modules/tarjetas/tarjetas.service'
import { UsersService } from '@/src/modules/users/users.service'
import { JwtStrategy } from '@/src/strategies/jwt.strategy'

@Module({
  controllers: [CreditCardController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
      }),
    }),
    TypeOrmModule.forFeature([CreditCard]),
    TypeOrmModule.forFeature([Usuario]),
    TypeOrmModule.forFeature([Movement]),
    TypeOrmModule.forFeature([Receipt]),
  ],
  providers: [
    JwtStrategy,
    UsersService,
    TarjetasService,
    MovementsService,
    PdfService,
    CreditCardService,
    ReceiptsService,
  ],
})
export class CreditCardModule {}
