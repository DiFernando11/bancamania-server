import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm'

@Entity()
@Unique(['email', 'phone_number']) // Hacemos que el teléfono también sea único
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true, unique: true })
  email: string

  @Column({ type: 'simple-array', nullable: true, default: '' })
  authMethods: string[]

  @Column({ nullable: true })
  password: string

  @Column({ nullable: true })
  image: string

  @Column({ nullable: true })
  first_name: string

  @Column({ nullable: true })
  last_name: string

  @Column({ nullable: true })
  address: string

  @Column({ type: 'boolean', default: false })
  isVerify: boolean

  @Column({ type: 'boolean', default: false })
  isVerifyPhone: boolean

  @Column({ nullable: true, length: 6 })
  verificationCode: string

  @Column({ type: 'timestamp', nullable: true })
  verificationExpiresAt: Date

  @Column({ nullable: true, unique: true })
  phone_number: string
}
