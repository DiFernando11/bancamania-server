import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Account } from '@/src/modules/account/account.entity'
import { Movement } from '@/src/modules/movements/movements.entity'
import { Usuario } from '@/src/modules/users/users.entity'

@Entity()
@Unique(['cardNumber'])
export class DebitCard {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  cardNumber: string

  @Column()
  expirationDate: string

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date

  @Column()
  cvv: string

  @Column()
  owner: string

  @Column({ default: 'inactive' })
  status: 'active' | 'blocked' | 'suspended' | 'inactive'

  @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: Usuario

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn()
  account: Account

  @OneToMany(() => Movement, (movement) => movement.debitCard)
  movements: Movement[]
}
