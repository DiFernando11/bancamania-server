import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Account } from '../account/account.entity'

@Entity()
@Unique(['email', 'phone_number']) // Hacemos que el teléfono también sea único
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true, unique: true })
  email: string

  @Column({ default: '', nullable: true, type: 'simple-array' })
  authMethods: string[]

  @Column({ nullable: true })
  password: string

  @Column({ nullable: true })
  image: string

  @Column({ nullable: true })
  first_name: string

  @Column({ nullable: true })
  last_name: string

  @Column({ nullable: true })
  address: string

  @Column({ nullable: true, unique: true })
  phone_number: string

  @OneToOne(() => Account, (account) => account.user)
  account: Account
}
