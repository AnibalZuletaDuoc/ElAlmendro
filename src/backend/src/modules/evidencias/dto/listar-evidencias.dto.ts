import { IsUUID } from 'class-validator';

export class ListarEvidenciasDto {
  @IsUUID(undefined, { message: 'La actividad indicada no es valida.' })
  actividadId: string;
}
