import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class EnviarMensajeDto {
  /** Sin receptor el mensaje va al canal general del equipo. */
  @IsOptional()
  @IsUUID(undefined, { message: 'El destinatario indicado no es valido.' })
  receptorId?: string;

  @IsString({ message: 'El mensaje debe ser texto.' })
  @IsNotEmpty({ message: 'El mensaje no puede estar vacio.' })
  @MaxLength(2000, { message: 'El mensaje no puede superar los 2000 caracteres.' })
  cuerpo: string;
}
