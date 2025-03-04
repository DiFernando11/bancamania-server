import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Usuario } from '@/src/modules/users/users.entity'

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: Usuario

  @Column()
  title: string

  @Column('json')
  dataReceipts: { key: string; value?: string | number; style?: any }[]

  @Column('text')
  description: string

  @CreateDateColumn()
  createdAt: Date
}
