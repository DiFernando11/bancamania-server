import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { DeferredPurchase } from '@/src/modules/deferredInstallment/deferredPurchase.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { CreditCardVersion } from '@/src/modules/tarjetas/creditCard/creditCardVersions.entity'
import { CardStatus } from '@/src/modules/tarjetas/enum/cardStatus.enum'
import { Usuario } from '@/src/modules/users/users.entity'

@Entity()
@Unique(['cardNumber'])
export class CreditCard {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  cardNumber: string

  @Column()
  expirationDate: string

  @CreateDateColumn()
  createdAt: Date

  @Column()
  cvv: string

  @Column({ default: 5000 })
  miles: number

  @Column('decimal', { precision: 12, scale: 2 })
  quota: number

  @Column({ default: CardStatus.BLOCKED })
  status: CardStatus

  @ManyToOne(() => Usuario, (user) => user.creditCards, { onDelete: 'CASCADE' })
  user: Usuario

  @ManyToOne(() => CreditCardVersion, { eager: true })
  version: CreditCardVersion

  @OneToMany(() => Movement, (movement) => movement.creditCard)
  movements: Movement[]

  @OneToMany(() => DeferredPurchase, (purchase) => purchase.creditCard)
  deferredPurchases: DeferredPurchase[]
}
