import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class EmailDto {
  @IsEmail({}, { message: 'EMAIL_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'EMAIL_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string;

  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @MinLength(8, { message: 'PASSWORD_MIN_LENGTH' })
  @Matches(/(?=.*[a-z])/, { message: 'PASSWORD_LOWERCASE' })
  @Matches(/(?=.*[A-Z])/, { message: 'PASSWORD_UPPERCASE' })
  @Matches(/(?=.*\d)/, { message: 'PASSWORD_NUMBER' })
  @Matches(/(?=.*[@$!%*?&])/, { message: 'PASSWORD_SPECIAL_CHAR' })
  password: string;
}

export class RegisterVerifyCodeDto {
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string;

  @IsNotEmpty({ message: 'CODE_REQUIRED' })
  code: string;
}

export class RegisterPhoneDto {
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  phone: string;
}

export class RegisterPhone {
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  phone: string;

  @IsNotEmpty({ message: 'TOKEN_REQUIRED' })
  idToken: string;
}

export class TokenDto {
  @IsNotEmpty({ message: 'TOKEN_REQUIRED' })
  idToken: string;
}

export class ValidatePhoneRegister {
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  phone: string;

  @IsNotEmpty({ message: 'CODE_REQUIRED' })
  code: string;
}

export class CodeToEmailByPhoneDto {
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  phone: string;

  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string;
}
