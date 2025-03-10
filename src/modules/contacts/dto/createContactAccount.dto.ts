import { IsNotEmpty, IsUUID, Length } from 'class-validator'

export class CreateContactAccountDto {
  @IsUUID()
  @IsNotEmpty()
  accountId: string

  @IsNotEmpty()
  @Length(2, 24)
  alias: string
}
