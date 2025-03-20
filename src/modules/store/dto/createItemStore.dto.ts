import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'

export class CreateItemStoreDto {
  @IsNotEmpty()
  @IsString()
  title: string

  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  miles: number

  @IsNotEmpty()
  @IsString()
  image: string
}
