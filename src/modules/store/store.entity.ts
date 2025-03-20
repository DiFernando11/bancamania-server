import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column()
  description: string

  @Column()
  image: string

  @Column({ default: 1, nullable: false, type: 'decimal' })
  price: number

  @Column()
  miles: number
}
