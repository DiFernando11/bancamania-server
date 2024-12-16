// src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class EmailDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[a-z])/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  @Matches(/(?=.*\d)/, {
    message: 'La contraseña debe contener al menos un número',
  })
  @Matches(/(?=.*[@$!%*?&])/, {
    message:
      'La contraseña debe contener al menos un carácter especial (@, $, !, %, *, ?, &)',
  })
  password: string;
}

export class RegisterVerifyCodeDto {
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsNotEmpty({ message: 'El codigo de verificacion es obligatorio' })
  code: string;
}

export class RegisterPhoneDto {
  @IsNotEmpty({ message: 'El numero de celular es obligatorio' })
  phone: string;
}
export class RegisterPhone {
  @IsNotEmpty({ message: 'El numero de telefono es obligatorio' })
  phone: string;
  @IsNotEmpty({ message: 'El token es obligatorio' })
  idToken: string;
}

export class TokenDto {
  @IsNotEmpty({ message: 'El token es obligatorio' })
  idToken: string;
}

export class ValidatePhoneRegister {
  @IsNotEmpty({ message: 'El numero de celular es obligatorio' })
  phone: string;
  @IsNotEmpty({ message: 'El codigo es obligatorio' })
  code: string;
}

export class CodeToEmailByPhoneDto {
  @IsNotEmpty({ message: 'El numero de celular es obligatorio' })
  phone: string;
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;
}
