import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CreditCardBrand } from '@/src/modules/tarjetas/creditCard/creditCardBrand.entity'

@Entity()
export class CreditCardVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column('decimal', { precision: 5, scale: 3 })
  interestRate: number

  @Column('decimal', { precision: 5, scale: 2 })
  latePaymentInterestRate?: number

  @Column('int')
  maxInstallmentsWithoutInterest: number

  @Column('decimal', { default: 0, precision: 12, scale: 2 })
  limit: number

  @ManyToOne(() => CreditCardVersion, { nullable: true })
  nextVersion?: CreditCardVersion

  @ManyToOne(() => CreditCardBrand, (brand) => brand.versions, { eager: true })
  brand: CreditCardBrand
}
