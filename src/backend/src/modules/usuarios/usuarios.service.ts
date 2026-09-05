import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Consultas de personas. Por ahora solo lo que necesitan los filtros de pantalla. */
@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Trabajadores activos, para poblar el selector del calendario y los reportes. */
  async trabajadores(soloId?: string) {
    const filas = await this.prisma.usuario.findMany({
      where: {
        rol: 'TRABAJADOR',
        activo: true,
        ...(soloId ? { id: soloId } : {}),
      },
      select: { id: true, nombreCompleto: true },
      orderBy: { nombreCompleto: 'asc' },
    });
    return filas.map((f) => ({ id: f.id, nombre: f.nombreCompleto }));
  }
}
