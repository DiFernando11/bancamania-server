import { IsNotEmpty } from 'class-validator'
import { PhoneDto } from '@/src/dtos'

export class RegisterPhone extends PhoneDto {
  @IsNotEmpty({ message: 'TOKEN_REQUIRED' })
  idToken: string
}

export class ValidatePhoneRegister extends PhoneDto {
  @IsNotEmpty({ message: 'CODE_REQUIRED' })
  code: string
}
