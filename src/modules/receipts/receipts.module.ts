import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { MovementsService } from '@/src/modules/movements/movements.service'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { ReceiptsController } from '@/src/modules/receipts/receipts.controller'
import { Receipt } from '@/src/modules/receipts/receipts.entity'
import { ReceiptsService } from '@/src/modules/receipts/receipts.service'
import { UsersService } from '@/src/modules/users/users.service'
import { JwtStrategy } from '@/src/strategies/jwt.strategy'

@Module({
  controllers: [ReceiptsController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
      }),
    }),
    TypeOrmModule.forFeature([Movement]),
    TypeOrmModule.forFeature([Usuario]),
    TypeOrmModule.forFeature([Receipt]),
  ],
  providers: [
    JwtStrategy,
    UsersService,
    MovementsService,
    PdfService,
    ReceiptsService,
  ],
})
export class ReceiptsModule {}
