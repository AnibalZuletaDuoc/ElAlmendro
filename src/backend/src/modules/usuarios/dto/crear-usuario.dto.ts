import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol } from '../../../common/rbac';

export class CrearUsuarioDto {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  email: string;

  @IsString({ message: 'El nombre completo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío.' })
  nombreCompleto: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  contrasena: string;

  @IsIn(['ADMINISTRADOR', 'SUPERVISOR', 'TRABAJADOR'], {
    message: 'El rol debe ser ADMINISTRADOR, SUPERVISOR o TRABAJADOR.',
  })
  rol: Rol;

  @IsOptional()
  @IsString()
  zonaHoraria?: string;
}

