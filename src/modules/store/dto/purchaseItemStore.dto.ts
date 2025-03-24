import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'
import { METHOD_PAY, TYPE_CARD } from '@/src/modules/tarjetas/enum/cards'

class ProductItemDto {
  @IsUUID('4', { message: 'IS_UUID' })
  id: string

  @IsInt({ message: 'IS_WHOLE_NUMBER' })
  @Min(1, { message: 'IS_MIN_ONE' })
  quantity: number
}

export class PurchaseItemsStoreDto {
  @IsUUID('4', { message: 'DEBIT_CARD_ID_INVALID' })
  idCard: string

  @IsOptional()
  @IsEnum(METHOD_PAY, {
    message: 'METHOD_PAY',
  })
  methodPay?: METHOD_PAY

  @IsOptional()
  @IsNumber({}, { message: 'IS_NUMBER' })
  deferredMonth: number = 0

  @IsArray({ message: 'IS_ARRAY' })
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  products: ProductItemDto[]

  @IsEnum(TYPE_CARD, {
    message: 'TYPE_CARD',
  })
  typeCard: TYPE_CARD
}
