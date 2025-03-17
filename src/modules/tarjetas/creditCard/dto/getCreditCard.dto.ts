import { IsUUID } from 'class-validator'

export class GetCardCreditDto {
  @IsUUID('4', { message: 'El UUID debe ser de tipo v4' })
  uuid: string
}
