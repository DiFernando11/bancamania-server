import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Account } from '@/src/modules/account/account.entity'
import { Usuario } from '@/src/modules/users/users.entity'

@Entity()
@Unique(['user', 'account'])
export class ContactAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  alias: string

  @ManyToOne(() => Usuario, (user) => user.contactAccount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: Usuario

  @ManyToOne(() => Account, (account) => account.contactAccount, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  account: Account
}
