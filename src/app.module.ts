import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { CookieResolver, I18nModule } from 'nestjs-i18n'
import * as path from 'path'
import { AccountModule } from '@/src/modules/account/account.module'
import { ContactAccountsModule } from '@/src/modules/contacts/contactAccounts..module'
import { MovementsModule } from '@/src/modules/movements/movements.module'
import { PdfModule } from '@/src/modules/pdf/pdf.module'
import { ReceiptsModule } from '@/src/modules/receipts/receipts.module'
import { StoreModule } from '@/src/modules/store/store.module'
import { CreditCardModule } from '@/src/modules/tarjetas/creditCard/creditCard.module'
import { DebitCardModule } from '@/src/modules/tarjetas/debitCard/debitCard.module'
import { TransfersModule } from '@/src/modules/transfers/transfers.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import appConfig from './config/app.config'
import { AuthModule } from './modules/auth/auth.module'
import { CroneModule } from './modules/crone/crone.module'
import { FirebaseModule } from './modules/firebase/firebase.module'
import { Usuario } from './modules/users/users.entity'
import { UsersModule } from './modules/users/users.module'
import { WhatsappModule } from './modules/whatsapp/whatsapp.module'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      isGlobal: true,
      load: [appConfig],
    }),
    AuthModule,
    UsersModule,
    WhatsappModule,
    FirebaseModule,
    CroneModule,
    AccountModule,
    DebitCardModule,
    MovementsModule,
    PdfModule,
    TransfersModule,
    ReceiptsModule,
    ContactAccountsModule,
    CreditCardModule,
    StoreModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        autoLoadEntities: true,
        database: configService.get<string>('database.name'),
        entities: [Usuario],
        host: configService.get<string>('database.host'),
        password: configService.get<string>('database.password'),
        port: configService.get<number>('database.port'),
        synchronize: configService.get<boolean>('database.synchronize'),
        type: 'postgres',
        username: configService.get<string>('database.username'),
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '../i18n'),
        watch: true,
      },
      resolvers: [new CookieResolver(['NEXT_LOCALE'])],
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
