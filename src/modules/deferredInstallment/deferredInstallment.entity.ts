import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { DeferredPurchase } from './deferredPurchase.entity'

@Entity()
export class DeferredInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => DeferredPurchase, (dp) => dp.installments, {
    onDelete: 'CASCADE',
  })
  deferredPurchase: DeferredPurchase

  @Column('int')
  installmentNumber: number

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number

  @Column('timestamp')
  dueDate: Date

  @Column({ default: false })
  paid: boolean

  @Column({ nullable: true, type: 'timestamp' })
  paidAt: Date
}
