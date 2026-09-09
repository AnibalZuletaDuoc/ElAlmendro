import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearProyectoDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del proyecto no puede estar vacío.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  descripcion?: string;
}
