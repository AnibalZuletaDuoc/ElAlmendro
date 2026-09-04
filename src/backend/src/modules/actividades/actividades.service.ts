import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** US-03 y US-04 — consulta de actividades y su tiempo acumulado. */
@Injectable()
export class ActividadesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Actividades del trabajador con el tiempo real acumulado.
   *
   * El tiempo no se almacena en ninguna columna: se calcula sumando los tramos
   * de todas las sesiones de la actividad. Es imposible que un total guardado
   * difiera del detalle, porque no hay total guardado.
   */
  async mias(usuarioId: string) {
    const actividades = await this.prisma.actividad.findMany({
      where: { responsableId: usuarioId, eliminadoEn: null },
      orderBy: [{ estado: 'asc' }, { orden: 'asc' }, { creadoEn: 'asc' }],
      include: {
        proyecto: { select: { nombre: true } },
        subtareas: { orderBy: { orden: 'asc' } },
        responsable: { select: { nombreCompleto: true } },
      },
    });

    const tiempos = await this.segundosPorActividad(
      actividades.map((a) => a.id),
    );

    return actividades.map((a) => ({
      ...a,
      segundosTrabajados: tiempos.get(a.id) ?? 0,
    }));
  }

  async detalle(id: string) {
    const actividad = await this.prisma.actividad.findFirst({
      where: { id, eliminadoEn: null },
      include: {
        proyecto: { select: { nombre: true } },
        subtareas: { orderBy: { orden: 'asc' } },
        responsable: { select: { nombreCompleto: true } },
        comentarios: {
          orderBy: { creadoEn: 'desc' },
          include: { autor: { select: { nombreCompleto: true } } },
        },
      },
    });
    if (!actividad) throw new NotFoundException('La actividad no existe.');

    const tiempos = await this.segundosPorActividad([actividad.id]);
    return { ...actividad, segundosTrabajados: tiempos.get(actividad.id) ?? 0 };
  }

  /**
   * Suma de los tramos de cada actividad, en segundos.
   *
   * Se devuelve en segundos y no en minutos redondeados porque una sesion
   * breve —frecuente al probar el sistema— se veria como cero minutos, y el
   * trabajador concluiria que su tiempo no quedo registrado.
   */
  private async segundosPorActividad(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();

    const filas = await this.prisma.$queryRaw<
      { actividadId: string; segundos: number }[]
    >`
      SELECT s."actividadId" AS "actividadId",
             COALESCE(SUM(
               EXTRACT(EPOCH FROM (COALESCE(t."terminoEn", now()) - t."inicioEn"))
             ), 0) AS segundos
        FROM sesiones_trabajo s
        JOIN tramos_sesion t ON t."sesionId" = s.id
       WHERE s."actividadId" = ANY(${ids}::uuid[])
       GROUP BY s."actividadId"
    `;

    return new Map(
      filas.map((f) => [f.actividadId, Math.round(Number(f.segundos))]),
    );
  }
}
