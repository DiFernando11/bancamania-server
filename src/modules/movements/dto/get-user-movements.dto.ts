import { Transform } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator'

export class GetUserMovementsDto {
  @IsOptional()
  @IsUUID('4', { message: 'ACCOUNT_ID_INVALID' })
  accountId?: string

  @IsOptional()
  @IsUUID('4', { message: 'DEBIT_CARD_ID_INVALID' })
  debitCardId?: string

  @IsOptional()
  @IsUUID('4', { message: 'CREDIT_CARD_ID_INVALID' })
  creditCardId?: string

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt({ message: 'LIMIT_NUMBER' })
  limit?: number

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsInt({ message: 'PAGE_NUMBER' })
  @Min(1, { message: 'PAGE_MIN' })
  page?: number

  @IsOptional()
  @IsDateString({}, { message: 'DATE_FROM_INVALID' })
  fechaDesde?: string

  @IsOptional()
  @IsDateString({}, { message: 'DATE_TO_INVALID' })
  fechaHasta?: string
}
