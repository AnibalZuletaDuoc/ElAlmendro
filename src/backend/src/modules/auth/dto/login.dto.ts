import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato valido.' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contrasena es obligatoria.' })
  contrasena: string;
}
