import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('reportes')
@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  /**
   * El administrador ve a todo el equipo; el trabajador, solo lo suyo. No basta
   * con ocultarlo en la interfaz: el filtro se aplica aqui.
   */
  private alcance(u: UsuarioActual): string | undefined {
    return u.rol === 'ADMINISTRADOR' ? undefined : u.id;
  }

  @Get('calendario')
  calendario(
    @Usuario() u: UsuarioActual,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportes.calendario(
      new Date(desde),
      new Date(hasta),
      this.alcance(u),
    );
  }

  @Get('dia')
  dia(@Usuario() u: UsuarioActual, @Query('fecha') fecha: string) {
    return this.reportes.dia(fecha, this.alcance(u));
  }

  @Get('horas')
  horas(
    @Usuario() u: UsuarioActual,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportes.porTrabajador(new Date(desde), new Date(hasta));
  }

  @Get('actividades')
  actividades(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.reportes.porActividad(new Date(desde), new Date(hasta));
  }
}
