import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from 'src/modules/users/users.entity'
import { Account } from '@/src/modules/account/account.entity'
import { AccountService } from '@/src/modules/account/account.service'
import { ContactAccountController } from '@/src/modules/contacts/contactAccounts..controller'
import { ContactAccountsService } from '@/src/modules/contacts/contactAccounts..service'
import { ContactAccount } from '@/src/modules/contacts/contactAccounts.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { MovementsService } from '@/src/modules/movements/movements.service'
import { PdfService } from '@/src/modules/pdf/pdf.service'
import { UsersService } from '@/src/modules/users/users.service'
import { JwtStrategy } from '../../strategies/jwt.strategy'

@Module({
  controllers: [ContactAccountController],
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
    TypeOrmModule.forFeature([ContactAccount]),
  ],
  providers: [
    JwtStrategy,
    AccountService,
    UsersService,
    MovementsService,
    ContactAccountsService,
    PdfService,
  ],
})
export class ContactAccountsModule {}
