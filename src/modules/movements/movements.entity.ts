import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Account } from '@/src/modules/account/account.entity'
import { TypeMovement } from '@/src/modules/movements/enum/type-movement.enum'
import { DebitCard } from '@/src/modules/tarjetas/debitCard/debitCard.entity'
import { Usuario } from '@/src/modules/users/users.entity'

@Entity('movements')
export class Movement {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true, precision: 10, scale: 2, type: 'decimal' })
  balance?: number

  @Column({ precision: 10, scale: 2, type: 'decimal' })
  totalBalance: number

  @Column({ length: 255, type: 'varchar' })
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ enum: TypeMovement, type: 'enum' })
  typeMovement: TypeMovement

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: Usuario

  @ManyToOne(() => Account, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  account?: Account

  @ManyToOne(() => DebitCard, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  debitCard?: DebitCard
}
