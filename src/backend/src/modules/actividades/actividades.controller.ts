import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActividadesService } from './actividades.service';
import { CrearActividadDto } from './dto/crear-actividad.dto';
import { ActualizarActividadDto } from './dto/actualizar-actividad.dto';
import { ReasignarActividadDto } from './dto/reasignar-actividad.dto';
import { PERMISOS } from '../../common/rbac';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { ExigirPermisos } from '../../common/decorators/permisos.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('actividades')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('actividades')
export class ActividadesController {
  constructor(private readonly actividades: ActividadesService) {}

  /** Actividades asignadas al trabajador de la sesion. */
  @Get('mias')
  mias(@Usuario() u: UsuarioActual) {
    return this.actividades.mias(u.id);
  }

  /** Crea una tarea nueva, opcionalmente colgada de otra (mapa de nodos). */
  @Post()
  crear(@Usuario() u: UsuarioActual, @Body() dto: CrearActividadDto) {
    return this.actividades.crear(u.id, dto);
  }

  @Get(':id')
  detalle(@Param('id') id: string) {
    return this.actividades.detalle(id);
  }

  /** Reasigna el padre de la tarea en el arbol de nodos. */
  @Patch(':id')
  @ExigirPermisos(PERMISOS.ACTIVIDADES_GESTIONAR)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarActividadDto) {
    return this.actividades.actualizarPadre(id, dto);
  }

  /** US-06 — deriva la tarea a otra persona (administrador o supervisor). */
  @Patch(':id/responsable')
  @ExigirPermisos(PERMISOS.ACTIVIDADES_GESTIONAR)
  reasignar(
    @Param('id') id: string,
    @Usuario() u: UsuarioActual,
    @Body() dto: ReasignarActividadDto,
  ) {
    return this.actividades.reasignar(id, u.id, dto);
  }
}
