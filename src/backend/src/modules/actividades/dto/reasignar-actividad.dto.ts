import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class ReasignarActividadDto {
  @IsUUID(undefined, { message: 'El usuario indicado no es valido.' })
  usuarioId: string;

  /** Obligatorio por criterio de aceptacion de US-06: toda derivacion lleva motivo. */
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo de la derivacion.' })
  @MaxLength(300, { message: 'El motivo no puede superar los 300 caracteres.' })
  motivo: string;
}
