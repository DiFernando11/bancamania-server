import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator'

export class CreateDeferredPurchaseDto {
  @IsUUID(undefined, {
    message: 'IS_UUID',
  })
  cardId: string

  @IsNumber(
    {},
    {
      message: 'IS_NUMBER',
    }
  )
  @Min(0.01, {
    message: 'IS_GREATER_ZERO',
  })
  total: number

  @IsInt({
    message: 'IS_NUMBER',
  })
  @Min(1, {
    message: 'IS_MIN_ONE',
  })
  deferredMonth: number

  @IsOptional()
  @IsString()
  description?: string
}
