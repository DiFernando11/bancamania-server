import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { Account } from '@/src/modules/account/account.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { TransfersController } from '@/src/modules/transfers/transfers.controller'
import { TransfersService } from '@/src/modules/transfers/transfers.service'
import { JwtStrategy } from '@/src/strategies/jwt.strategy'

@Module({
  controllers: [TransfersController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
      }),
    }),
    TypeOrmModule.forFeature([Usuario]),
    TypeOrmModule.forFeature([Account]),
    TypeOrmModule.forFeature([Movement]),
  ],
  providers: [JwtStrategy, PdfService, TransfersService],
})
export class TransfersModule {}
