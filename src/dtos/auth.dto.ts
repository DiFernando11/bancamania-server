import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator'

export class EmailDto {
  @IsEmail({}, { message: 'EMAIL_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string
}

export class PasswordDto {
  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @MinLength(8, { message: 'PASSWORD_MIN_LENGTH' })
  @Matches(/(?=.*[a-z])/, { message: 'PASSWORD_LOWERCASE' })
  @Matches(/(?=.*[A-Z])/, { message: 'PASSWORD_UPPERCASE' })
  @Matches(/(?=.*\d)/, { message: 'PASSWORD_NUMBER' })
  @Matches(/(?=.*[@$!%*?&])/, { message: 'PASSWORD_SPECIAL_CHAR' })
  password: string
}

export class PhoneDto {
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  phone: string
}

export class TokenDto {
  @IsNotEmpty({ message: 'TOKEN_REQUIRED' })
  idToken: string
}
