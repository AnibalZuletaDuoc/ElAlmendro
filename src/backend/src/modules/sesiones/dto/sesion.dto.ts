import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class IniciarSesionDto {
  @IsUUID(undefined, { message: 'La actividad indicada no es valida.' })
  actividadId: string;
}

export class CerrarSesionDto {
  @IsIn(['COMPLETADA', 'INCONCLUSA'], {
    message: 'Debes declarar si la dejas completada o inconclusa.',
  })
  desenlace: 'COMPLETADA' | 'INCONCLUSA';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notaCierre?: string;
}
