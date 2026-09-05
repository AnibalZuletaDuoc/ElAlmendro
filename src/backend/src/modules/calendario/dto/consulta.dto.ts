import { IsOptional, IsUUID, Matches } from 'class-validator';

/** Un dia local en formato AAAA-MM-DD. Nunca un instante ISO. */
const DIA_LOCAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Rango de consulta del calendario.
 *
 * Las fechas viajan como dia local y no como instante UTC a proposito: el
 * limite de un dia en Santiago depende del horario de verano vigente, y esa
 * conversion la resuelve el motor. Aceptar un ISO aqui obligaria al navegador a
 * calcular el desfase, que es justo el riesgo RA-02 del registro de riesgos.
 */
export class RangoDto {
  @Matches(DIA_LOCAL, { message: 'El campo "desde" debe venir como AAAA-MM-DD.' })
  desde: string;

  @Matches(DIA_LOCAL, { message: 'El campo "hasta" debe venir como AAAA-MM-DD.' })
  hasta: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'El trabajador indicado no es valido.' })
  trabajadorId?: string;
}
