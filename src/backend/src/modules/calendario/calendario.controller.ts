import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CalendarioService } from './calendario.service';
import { RangoDto } from './dto/consulta.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('calendario')
@UseGuards(JwtAuthGuard)
@Controller('calendario')
export class CalendarioController {
  constructor(private readonly calendario: CalendarioService) {}

  /**
   * El administrador elige a quien mirar; el trabajador solo se ve a si mismo.
   *
   * El `trabajadorId` que llega en la consulta se descarta cuando quien pregunta
   * no es administrador: la interfaz oculta el selector, pero confiar en eso
   * dejaria los datos del equipo a un cambio de URL de distancia.
   */
  private alcance(u: UsuarioActual, pedido?: string): string | undefined {
    if (u.rol !== 'ADMINISTRADOR') return u.id;
    return pedido || undefined;
  }

  /** Matriz dia x trabajador: alimenta la rejilla mensual y la vista matriz. */
  @Get('resumen')
  resumen(@Usuario() u: UsuarioActual, @Query() q: RangoDto) {
    return this.calendario.resumen(q.desde, q.hasta, this.alcance(u, q.trabajadorId));
  }

  /** Sesiones y jornadas del rango: alimenta el panel del dia y la semana. */
  @Get('detalle')
  detalle(@Usuario() u: UsuarioActual, @Query() q: RangoDto) {
    return this.calendario.detalle(q.desde, q.hasta, this.alcance(u, q.trabajadorId));
  }
}
