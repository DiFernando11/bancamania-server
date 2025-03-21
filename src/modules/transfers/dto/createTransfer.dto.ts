import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator'

export class TransferDto {
  @IsNotEmpty({ message: 'AMOUNT_REQUIRED' })
  @IsNumber({}, { message: 'AMOUNT_NUMBER' })
  @Min(0.01, { message: 'AMOUNT_MIN' })
  amount: number

  @IsNotEmpty({ message: 'DESTINATION_ACCOUNT_REQUIRED' })
  @IsUUID('4', { message: 'ACCOUNT_ID_INVALID' })
  destinationAccountId: string

  @IsNotEmpty({ message: 'ORIGIN_ACCOUNT_REQUIRED' })
  @IsUUID('4', { message: 'ACCOUNT_ID_INVALID' })
  originAccountId: string

  @IsOptional()
  @MaxLength(24, { message: '24_MAX_LENGTH' })
  motive: string
}
