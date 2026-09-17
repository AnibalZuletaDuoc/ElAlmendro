import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NodosService } from './nodos.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('nodos')
@UseGuards(JwtAuthGuard)
@Controller('nodos')
export class NodosController {
  constructor(private readonly nodos: NodosService) {}

  @Get()
  arbol(@Usuario() u: UsuarioActual, @Query('proyectoId') proyectoId?: string) {
    return this.nodos.arbol(u, proyectoId);
  }
}
