import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActividadesService } from './actividades.service';
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

  @Get(':id')
  detalle(@Param('id') id: string) {
    return this.actividades.detalle(id);
  }
}
