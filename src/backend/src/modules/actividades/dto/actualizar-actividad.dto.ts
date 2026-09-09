import { IsOptional, IsUUID } from 'class-validator';

export class ActualizarActividadDto {
  /** `null` desprende la tarea de su padre y la vuelve raiz del proyecto. */
  @IsOptional()
  @IsUUID(undefined, { message: 'La tarea padre indicada no es valida.' })
  actividadPadreId?: string | null;
}
