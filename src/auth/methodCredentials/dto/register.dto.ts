import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

export class AuthBaseDto {
  @IsEmail({}, { message: 'EMAIL_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string;

  @IsString({ message: 'PASSWORD_STRING' })
  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @Length(8, 20, { message: 'PASSWORD_MIN_LENGTH' })
  password: string;
}

export class CreateUserCredentialsDto extends AuthBaseDto {
  @IsString({ message: 'FIRSTNAME_STRING' })
  @IsNotEmpty({ message: 'FIRSTNAME_REQUIRED' })
  firstName: string;

  @IsString({ message: 'LASTNAME_STRING' })
  @IsNotEmpty({ message: 'LASTNAME_REQUIRED' })
  lastName: string;

  @IsNotEmpty({ message: 'CODE_REQUIRED' })
  @Length(6, 6, { message: 'CODE_LENGTH' })
  code: string;
}

export class ValidateCodeDto {
  @IsNotEmpty({ message: 'CODE_REQUIRED' })
  @Length(6, 6, { message: 'CODE_LENGTH' })
  code: string;

  @IsNotEmpty({ message: 'TOKEN_REQUIRED' })
  idToken: string;
}

export class LoginDto extends AuthBaseDto {}
