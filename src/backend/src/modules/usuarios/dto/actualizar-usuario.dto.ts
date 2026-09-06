import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol } from '../../../common/rbac';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El nombre completo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío.' })
  nombreCompleto?: string;

  @IsOptional()
  @IsIn(['ADMINISTRADOR', 'SUPERVISOR', 'TRABAJADOR'], {
    message: 'El rol debe ser ADMINISTRADOR, SUPERVISOR o TRABAJADOR.',
  })
  rol?: Rol;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano.' })
  activo?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  contrasena?: string;

  @IsOptional()
  @IsString()
  zonaHoraria?: string;
}

