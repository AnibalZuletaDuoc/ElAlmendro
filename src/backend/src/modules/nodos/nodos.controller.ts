import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NodosService } from './nodos.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@ApiTags('nodos')
@UseGuards(JwtAuthGuard)
@Controller('nodos')
export class NodosController {
  constructor(private readonly nodos: NodosService) {}

  @Get()
  arbol(@Query('proyectoId') proyectoId?: string) {
    return this.nodos.arbol(proyectoId);
  }
}
