import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { ContactAccount } from '@/src/modules/contacts/contactAccounts.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'
import { DebitCard } from '@/src/modules/tarjetas/debitCard/debitCard.entity'
import { Account } from '../account/account.entity'

@Entity()
@Unique(['email', 'phone_number'])
export class Usuario {
  @PrimaryGeneratedColumn('increment')
  id: number

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

  @OneToOne(() => DebitCard, (debitCard) => debitCard.user)
  debitCard: DebitCard

  @OneToMany(() => CreditCard, (creditCard) => creditCard.user)
  creditCards: CreditCard[]

  @OneToMany(() => Movement, (movement) => movement.user)
  movements: Movement[]

  @OneToMany(() => ContactAccount, (contactAccount) => contactAccount.user)
  contactAccount: ContactAccount[]
}
