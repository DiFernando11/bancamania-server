import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { Account } from '@/src/modules/account/account.entity'
import { DeferredInstallment } from '@/src/modules/deferredInstallment/deferredInstallment.entity'
import { DeferredPurchase } from '@/src/modules/deferredInstallment/deferredPurchase.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { ReceiptsService } from '@/src/modules/receipts/receipts.service'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { CreditCardService } from '@/src/modules/tarjetas/creditCard/creditCard.service'
import { CreditCardVersion } from '@/src/modules/tarjetas/creditCard/creditCardVersions.entity'
import { TarjetasService } from '@/src/modules/tarjetas/tarjetas.service'
import { JwtStrategy } from '../../strategies/jwt.strategy'
import { DeferredInstallmentController } from './deferredInstallment.controller'
import { DeferredInstallmentService } from './deferredInstallment.service'

@Module({
  controllers: [DeferredInstallmentController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
      }),
    }),
    TypeOrmModule.forFeature([Usuario]),
    TypeOrmModule.forFeature([Movement]),
    TypeOrmModule.forFeature([CreditCard]),
    TypeOrmModule.forFeature([DeferredInstallment]),
    TypeOrmModule.forFeature([Receipt]),
    TypeOrmModule.forFeature([DeferredPurchase]),
    TypeOrmModule.forFeature([CreditCardVersion]),
    TypeOrmModule.forFeature([Account]),
  ],
  providers: [
    JwtStrategy,
    CreditCardService,
    DeferredInstallmentService,
    PdfService,
    ReceiptsService,
    TarjetasService,
  ],
})
export class DeferredInstallmentModule {}
