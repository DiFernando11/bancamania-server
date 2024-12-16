import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

export class AuthBaseDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El email no puede estar vacío.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @Length(8, 20, {
    message: 'La contraseña debe tener entre 8 y 20 caracteres.',
  })
  password: string;
}

export class CreateUserCredentialsDto extends AuthBaseDto {
  @IsString({ message: 'El primer nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El primer nombre no puede estar vacío.' })
  firstName: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El apellido no puede estar vacío.' })
  lastName: string;

  @IsNotEmpty({ message: 'El codigo es requerido' })
  @Length(6, 6, {
    message: 'El código debe tener exactamente 6 caracteres. Revisa tu correo.',
  })
  code: string;
}

export class ValidateCodeDto {
  @IsNotEmpty({ message: 'El codigo es requerido' })
  @Length(6, 6, {
    message: 'El código debe tener exactamente 6 caracteres. Revisa tu correo.',
  })
  code: string;

  @IsNotEmpty({ message: 'idToken es requerido' })
  idToken: string;
}

export class LoginDto extends AuthBaseDto {}
