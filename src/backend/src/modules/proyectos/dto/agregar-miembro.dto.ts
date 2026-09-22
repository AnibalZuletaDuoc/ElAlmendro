import { IsUUID } from 'class-validator';

export class AgregarMiembroDto {
  @IsUUID(undefined, { message: 'El usuario indicado no es valido.' })
  usuarioId: string;
}
