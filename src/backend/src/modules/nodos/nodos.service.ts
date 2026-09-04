import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * US-05 y US-06 — mapa de nodos y derivaciones.
 *
 * El arbol expresa composicion: que actividad forma parte de que agrupacion.
 * La derivacion es un hecho historico distinto: que actividad paso de un
 * responsable a otro, cuando y por que motivo. Por eso son dos consultas y no
 * una sola.
 */
@Injectable()
export class NodosService {
  constructor(private readonly prisma: PrismaService) {}

  async arbol(proyectoId?: string) {
    const actividades = await this.prisma.actividad.findMany({
      where: {
        eliminadoEn: null,
        ...(proyectoId ? { proyectoId } : {}),
      },
      orderBy: [{ actividadPadreId: 'asc' }, { orden: 'asc' }],
      select: {
        id: true,
        titulo: true,
        estado: true,
        prioridad: true,
        actividadPadreId: true,
        posicionNodo: true,
        responsable: { select: { nombreCompleto: true } },
      },
    });

    const derivaciones = await this.prisma.derivacion.findMany({
      orderBy: { ocurridoEn: 'desc' },
      take: 20,
      select: {
        id: true,
        motivo: true,
        ocurridoEn: true,
        actividad: { select: { titulo: true } },
        deUsuario: { select: { nombreCompleto: true } },
        aUsuario: { select: { nombreCompleto: true } },
      },
    });

    return { actividades, derivaciones };
  }
}
