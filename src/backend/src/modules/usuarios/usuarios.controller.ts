import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('usuarios')
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  /**
   * La nomina completa es informacion del equipo. Un trabajador que consulte
   * esto se recibe a si mismo: asi el selector de la interfaz queda en un solo
   * elemento sin necesidad de una pantalla distinta.
   */
  @Get('trabajadores')
  trabajadores(@Usuario() u: UsuarioActual) {
    return this.usuarios.trabajadores(u.rol === 'ADMINISTRADOR' ? undefined : u.id);
  }
}
