import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UsuarioActual } from '../../common/usuario-actual.decorator';

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

  async arbol(u: UsuarioActual, proyectoId?: string) {
    const esTrabajador = u.rol === 'TRABAJADOR';

    const actividades = await this.prisma.actividad.findMany({
      where: {
        eliminadoEn: null,
        ...(proyectoId ? { proyectoId } : {}),
        ...(esTrabajador
          ? {
              OR: [
                { responsableId: u.id },
                { hijas: { some: { responsableId: u.id, eliminadoEn: null } } },
              ],
            }
          : {}),
      },
      orderBy: [{ actividadPadreId: 'asc' }, { orden: 'asc' }],
      select: {
        id: true,
        titulo: true,
        estado: true,
        prioridad: true,
        actividadPadreId: true,
        posicionNodo: true,
        responsableId: true,
        responsable: { select: { id: true, nombreCompleto: true } },
        // Monedas de cada bolsa: con ellas la vista dibuja cuanto lleva
        // llena la tarea sin pedir el detalle de una en una.
        subtareas: { select: { completada: true } },
      },
    });

    const derivaciones = await this.prisma.derivacion.findMany({
      where: esTrabajador
        ? {
            OR: [{ deUsuarioId: u.id }, { aUsuarioId: u.id }],
          }
        : undefined,
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

    return {
      actividades: actividades.map(({ subtareas, ...a }) => ({
        ...a,
        monedas: subtareas.length,
        monedasListas: subtareas.filter((m) => m.completada).length,
      })),
      derivaciones,
    };
  }
}
