import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
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
}
