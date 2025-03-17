import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Movement } from '@/src/modules/movements/movements.entity'
import {
  CreditCardVersion,
  TypeCredit,
} from '@/src/modules/tarjetas/creditCard/enums/creditEnum'
import { INITIAL_LIMIT } from '@/src/modules/tarjetas/creditCard/utils/credit'
import { CardStatus } from '@/src/modules/tarjetas/enum/cardStatus.enum'
import { Usuario } from '@/src/modules/users/users.entity'

@Entity()
@Unique(['cardNumber'])
export class CreditCard {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false, unique: true })
  cardNumber: string

  @Column({ nullable: false })
  expirationDate: string

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date

  @Column({ nullable: false })
  cvv: string

  @Column({ nullable: false })
  marca: TypeCredit

  @Column({ nullable: false })
  version: CreditCardVersion

  @Column({ default: 100 })
  miles: number

  @Column({ default: INITIAL_LIMIT, nullable: false, type: 'decimal' })
  limit: number

  @Column({ default: CardStatus.BLOCKED, nullable: false })
  status: CardStatus

  @ManyToOne(() => Usuario, (user) => user.creditCards, { onDelete: 'CASCADE' })
  user: Usuario

  @OneToMany(() => Movement, (movement) => movement.creditCard)
  movements: Movement[]
}
