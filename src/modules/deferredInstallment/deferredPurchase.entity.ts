import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { DeferredInstallment } from '@/src/modules/deferredInstallment/deferredInstallment.entity'
import { CreditCard } from '@/src/modules/tarjetas/creditCard/creditCard.entity'

@Entity()
export class DeferredPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => CreditCard, (card) => card.deferredPurchases)
  creditCard: CreditCard

  @Column('decimal', { precision: 12, scale: 2 })
  originalAmount: number

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate: number

  @Column('int')
  totalInstallments: number

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => DeferredInstallment, (i) => i.deferredPurchase)
  installments: DeferredInstallment[]
}
