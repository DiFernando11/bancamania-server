import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Usuario } from './users/users.entity';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CroneModule } from './crone/crone.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),
    AuthModule,
    UsersModule,
    WhatsappModule,
    FirebaseModule,
    CroneModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [Usuario],
        synchronize: configService.get<boolean>('database.synchronize'),
        autoLoadEntities: true,
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '../i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
