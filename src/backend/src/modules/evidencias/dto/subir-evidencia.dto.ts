import { IsUUID } from 'class-validator';

export class SubirEvidenciaDto {
  @IsUUID(undefined, { message: 'La actividad indicada no es valida.' })
  actividadId: string;
}
