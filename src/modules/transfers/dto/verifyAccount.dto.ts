import { IsNotEmpty, IsUUID } from 'class-validator'

export class VerifyAccountDto {
  @IsNotEmpty({ message: 'ACCOUNT_ID_REQUIRED' })
  @IsUUID('4', { message: 'ACCOUNT_ID_INVALID' })
  accountId: string
}
