import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Movement } from '@/src/modules/movements/movements.entity'
import { DebitCardStatus } from '@/src/modules/tarjetas/debitCard/enum/DebitCardStatus'
import { TypeCredit } from '@/src/modules/tarjetas/debitCard/enum/typeCredit'
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

  @Column({ default: DebitCardStatus.INACTIVE, nullable: false })
  status: DebitCardStatus

  @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: Usuario

  @OneToMany(() => Movement, (movement) => movement.creditCard)
  movements: Movement[]
}
