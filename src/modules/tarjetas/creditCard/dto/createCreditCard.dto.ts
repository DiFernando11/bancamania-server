import { IsEnum } from 'class-validator'
import { TypeCredit } from '@/src/modules/tarjetas/debitCard/enum/typeCredit'

export class CreateCreditCardDto {
  @IsEnum(TypeCredit, {
    message: 'La marca debe ser visa o mastercard',
  })
  marca: TypeCredit
}
