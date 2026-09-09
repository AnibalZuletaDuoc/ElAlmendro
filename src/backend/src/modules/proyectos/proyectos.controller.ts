import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProyectosService } from './proyectos.service';
import { CrearProyectoDto } from './dto/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('proyectos')
@UseGuards(JwtAuthGuard)
@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectos: ProyectosService) {}

  /** Proyectos del trabajador de la sesion (propios o donde es miembro). */
  @Get('mios')
  mios(@Usuario() u: UsuarioActual) {
    return this.proyectos.mios(u.id);
  }

  @Post()
  crear(@Usuario() u: UsuarioActual, @Body() dto: CrearProyectoDto) {
    return this.proyectos.crear(u.id, dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Usuario() u: UsuarioActual,
    @Body() dto: ActualizarProyectoDto,
  ) {
    return this.proyectos.actualizar(id, u.id, dto);
  }
}
