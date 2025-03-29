import { IsNotEmpty, IsUUID } from 'class-validator'

export class UUIDDto {
  @IsNotEmpty({ message: 'IS_UUID' })
  @IsUUID('4', { message: 'IS_REQUIRED' })
  uuid: string
}
