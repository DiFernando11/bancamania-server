import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'
import { PasswordDto } from '@/src/dtos'

export class AuthBaseDto extends PasswordDto {
  @IsEmail({}, { message: 'EMAIL_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string
}

export class CreateUserCredentialsDto extends AuthBaseDto {
  @IsString({ message: 'FIRSTNAME_STRING' })
  @IsNotEmpty({ message: 'FIRSTNAME_REQUIRED' })
  firstName: string

  @IsString({ message: 'LASTNAME_STRING' })
  @IsNotEmpty({ message: 'LASTNAME_REQUIRED' })
  lastName: string

  @IsNotEmpty({ message: 'CODE_REQUIRED' })
  @Length(6, 6, { message: 'CODE_LENGTH' })
  code: string
}
