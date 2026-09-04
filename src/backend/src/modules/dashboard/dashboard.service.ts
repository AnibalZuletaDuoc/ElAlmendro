import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** US-09 — indicadores del panel del administrador. */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen() {
    const [trabajando, enJornada, porEstado, hoy, semana] = await Promise.all([
      // Quien esta cronometrando en este momento.
      this.prisma.sesionTrabajo.findMany({
        where: { estado: { in: ['ACTIVA', 'PAUSADA'] } },
        select: {
          id: true,
          estado: true,
          inicioEn: true,
          usuario: { select: { nombreCompleto: true } },
          actividad: { select: { titulo: true } },
        },
      }),
      this.prisma.jornada.count({ where: { terminoEn: null } }),
      this.prisma.actividad.groupBy({
        by: ['estado'],
        where: { eliminadoEn: null },
        _count: { _all: true },
      }),
      this.segundos('hoy'),
      this.segundos('semana'),
    ]);

    return {
      trabajandoAhora: trabajando,
      jornadasAbiertas: enJornada,
      actividadesPorEstado: porEstado.map((p) => ({
        estado: p.estado,
        total: p._count._all,
      })),
      segundosHoy: hoy,
      segundosSemana: semana,
    };
  }

  /** Segundos trabajados por todo el equipo en el periodo indicado. */
  private async segundos(periodo: 'hoy' | 'semana'): Promise<number> {
    const filas = await this.prisma.$queryRaw<{ segundos: number }[]>`
      SELECT COALESCE(SUM(
               EXTRACT(EPOCH FROM (COALESCE(t."terminoEn", now()) - t."inicioEn"))
             ), 0)::int AS segundos
        FROM tramos_sesion t
       WHERE (t."inicioEn" AT TIME ZONE 'America/Santiago')::date
             >= (CASE WHEN ${periodo} = 'hoy'
                      THEN (now() AT TIME ZONE 'America/Santiago')::date
                      ELSE (now() AT TIME ZONE 'America/Santiago')::date - 6
                 END)
    `;
    return Number(filas[0]?.segundos ?? 0);
  }
}
