import { IsNotEmpty, Matches } from 'class-validator'

export class VerifyAccountDto {
  @IsNotEmpty({ message: 'ACCOUNT_ID_REQUIRED' })
  @Matches(/^\d{10}$/, { message: '10_DIGITS_NUMERIC' })
  accountNumber: string
}
