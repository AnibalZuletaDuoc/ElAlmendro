import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActividadesService } from './actividades.service';
import { CrearActividadDto } from './dto/crear-actividad.dto';
import { ActualizarActividadDto } from './dto/actualizar-actividad.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('actividades')
@UseGuards(JwtAuthGuard)
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
  actualizar(@Param('id') id: string, @Body() dto: ActualizarActividadDto) {
    return this.actividades.actualizarPadre(id, dto);
  }
}
