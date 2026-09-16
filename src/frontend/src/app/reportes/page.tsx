'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Marco from '@/components/Marco';
import GraficoBarras from '@/components/reportes/GraficoBarras';
import { api, ErrorApi } from '@/lib/api';
import { useDatosCache } from '@/lib/cacheDatos';
import { HorasActividad, HorasTrabajador } from '@/lib/tipos';
import { duracion } from '@/lib/formato';

const RANGOS = [
  { dias: 7, texto: 'Ultima semana' },
  { dias: 30, texto: 'Ultimo mes' },
  { dias: 90, texto: 'Ultimos 3 meses' },
];

/** US-07 — horas por trabajador y por actividad en un periodo. */
export default function Reportes() {
  const router = useRouter();
  const [dias, setDias] = useState(30);

  const cargar = useCallback(async () => {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    const q = `desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`;

    const [trabajadores, actividades] = await Promise.all([
      api.get<HorasTrabajador[]>(`/reportes/horas?${q}`),
      api.get<HorasActividad[]>(`/reportes/actividades?${q}`),
    ]);
    return { trabajadores, actividades };
  }, [dias]);

  // Al volver a esta pantalla se pinta con lo ultimo visto y revalida detras.
  const { datos, cargando, error } = useDatosCache(`reportes:${dias}`, cargar);
  const trabajadores = datos?.trabajadores ?? [];
  const actividades = datos?.actividades ?? [];

  useEffect(() => {
    if (error instanceof ErrorApi && error.estado === 401) router.replace('/login');
  }, [error, router]);

  const totalSeg = trabajadores.reduce((s, t) => s + t.segundos, 0);
  const grafico = actividades.map((a) => ({
    nombre: a.actividad,
    valor: Number((a.segundos / 3600).toFixed(1)),
    etiqueta: duracion(a.segundos),
  }));

  return (
    <Marco
      activo="/reportes"
      titulo="Reportes de horas"
      subtitulo="Agregacion por trabajador y por actividad"
      acciones={
        <select
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400"
        >
          {RANGOS.map((r) => (
            <option key={r.dias} value={r.dias}>
              {r.texto}
            </option>
          ))}
        </select>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Indicador etiqueta="Horas del periodo" valor={cargando ? null : duracion(totalSeg)} />
        <Indicador
          etiqueta="Trabajadores con registro"
          valor={cargando ? null : String(trabajadores.length)}
        />
        <Indicador
          etiqueta="Actividades trabajadas"
          valor={cargando ? null : String(actividades.length)}
        />
      </div>

      <section className="mb-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <h2 className="mb-4 font-bold text-white">Horas por trabajador</h2>
        {cargando ? (
          <Esqueleto filas={3} />
        ) : trabajadores.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Sin registros en el periodo seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Trabajador</th>
                  <th className="pb-2 text-right font-medium">Horas</th>
                  <th className="pb-2 text-right font-medium">Dias</th>
                  <th className="pb-2 text-right font-medium">Sesiones</th>
                  <th className="pb-2 text-right font-medium">Actividades</th>
                  <th className="pb-2 text-right font-medium">Promedio diario</th>
                </tr>
              </thead>
              <tbody>
                {trabajadores.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 font-medium text-white">{t.trabajador}</td>
                    <td className="py-2.5 text-right font-mono text-slate-200">{duracion(t.segundos)}</td>
                    <td className="py-2.5 text-right text-slate-400">{t.dias}</td>
                    <td className="py-2.5 text-right text-slate-400">{t.sesiones}</td>
                    <td className="py-2.5 text-right text-slate-400">{t.actividades}</td>
                    <td className="py-2.5 text-right font-mono text-slate-400">
                      {duracion(Math.round(t.segundos / Math.max(1, t.dias)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <h2 className="mb-4 font-bold text-white">Horas por actividad</h2>
        {cargando ? (
          <Esqueleto filas={5} />
        ) : grafico.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Sin registros en el periodo seleccionado.
          </p>
        ) : (
          <GraficoBarras datos={grafico} unidad="h" />
        )}
      </section>
    </Marco>
  );
}

function Indicador({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur">
      <p className="text-xs text-slate-400">{etiqueta}</p>
      {valor === null ? (
        <div className="mt-2 h-6 w-20 animate-pulse rounded-md bg-white/10" />
      ) : (
        <p className="mt-1 text-xl font-bold text-white">{valor}</p>
      )}
    </div>
  );
}

/** Placeholder con la forma del contenido: la pantalla no salta al llegar los datos. */
function Esqueleto({ filas }: { filas: number }) {
  return (
    <div className="flex flex-col gap-3 py-1">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-3.5 w-40 animate-pulse rounded bg-white/10" />
          <div
            className="h-3.5 animate-pulse rounded bg-white/5"
            style={{ width: `${70 - i * 11}%` }}
          />
        </div>
      ))}
    </div>
  );
}
