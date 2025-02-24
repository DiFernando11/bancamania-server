import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Movement } from '@/src/modules/movements/movements.entity'
import { Usuario } from '../users/users.entity'

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  accountNumber: string

  @Column({ default: 0, type: 'decimal' })
  balance: number

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date

  @OneToOne(() => Usuario, (user) => user.account)
  @JoinColumn({ name: 'userId' })
  user: Usuario

  @OneToMany(() => Movement, (movement) => movement.account)
  movements: Movement[]
}
