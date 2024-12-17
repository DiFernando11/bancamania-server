import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm' // Importa TypeOrmModule
import { Usuario } from './users.entity' // Asegúrate de importar la entidad Usuario
import { UsersService } from './users.service' // Asegúrate de importar el servicio

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]), // Importa la entidad Usuario
  ],
  providers: [UsersService], // Declara el UsersService como proveedor
  exports: [UsersService], // Exporta UsersService para que pueda ser utilizado en otros módulos (como AuthModule)
})
export class UsersModule {}
