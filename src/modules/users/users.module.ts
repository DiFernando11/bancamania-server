import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Usuario } from './users.entity'
import { UsersService } from './users.service'

@Module({
  exports: [UsersService],
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsersService],
})
export class UsersModule {}
