import { IsUUID } from 'class-validator'

export class ReceiptPdfDto {
  @IsUUID('4', { message: 'UUID must be a valid version 4 UUID' })
  uuid: string
}
