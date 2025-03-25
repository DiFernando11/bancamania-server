import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { CreditCardVersion } from '@/src/modules/tarjetas/creditCard/creditCardVersions.entity'

@Entity()
export class CreditCardBrand {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string

  @OneToMany(() => CreditCardVersion, (version) => version.brand)
  versions: CreditCardVersion[]
}
