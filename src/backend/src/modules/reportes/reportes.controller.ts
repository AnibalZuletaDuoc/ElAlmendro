import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISOS } from '../../common/rbac';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { ExigirPermisos } from '../../common/decorators/permisos.decorator';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('reportes')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  /**
   * Administradores y supervisores ven a todo el equipo; el trabajador, solo lo suyo.
   */
  private alcance(u: UsuarioActual): string | undefined {
    const puedeVerEquipo =
      u.permisos?.includes(PERMISOS.REPORTES_VER_EQUIPO) ||
      u.rol === 'ADMINISTRADOR' ||
      u.rol === 'SUPERVISOR';
    return puedeVerEquipo ? undefined : u.id;
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
  @ExigirPermisos(PERMISOS.REPORTES_VER_EQUIPO)
  horas(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportes.porTrabajador(new Date(desde), new Date(hasta));
  }

  @Get('actividades')
  @ExigirPermisos(PERMISOS.REPORTES_VER_EQUIPO)
  actividades(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportes.porActividad(new Date(desde), new Date(hasta));
  }
}
