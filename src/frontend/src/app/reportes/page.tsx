'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Marco from '@/components/Marco';
import { api, ErrorApi } from '@/lib/api';
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
  const [trabajadores, setTrabajadores] = useState<HorasTrabajador[]>([]);
  const [actividades, setActividades] = useState<HorasActividad[]>([]);

  const cargar = useCallback(async () => {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    const q = `desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`;

    const [t, a] = await Promise.all([
      api.get<HorasTrabajador[]>(`/reportes/horas?${q}`),
      api.get<HorasActividad[]>(`/reportes/actividades?${q}`),
    ]);
    setTrabajadores(t);
    setActividades(a);
  }, [dias]);

  useEffect(() => {
    cargar().catch((err) => {
      if (err instanceof ErrorApi && err.estado === 401) router.replace('/login');
    });
  }, [cargar, router]);

  const totalSeg = trabajadores.reduce((s, t) => s + t.segundos, 0);
  const grafico = actividades.map((a) => ({
    nombre: a.actividad.length > 26 ? a.actividad.slice(0, 26) + '…' : a.actividad,
    horas: Number((a.segundos / 3600).toFixed(1)),
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
        <Indicador etiqueta="Horas del periodo" valor={duracion(totalSeg)} />
        <Indicador etiqueta="Trabajadores con registro" valor={String(trabajadores.length)} />
        <Indicador
          etiqueta="Actividades trabajadas"
          valor={String(actividades.length)}
        />
      </div>

      <section className="mb-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <h2 className="mb-4 font-bold text-white">Horas por trabajador</h2>
        {trabajadores.length === 0 ? (
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
        {grafico.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Sin registros en el periodo seleccionado.
          </p>
        ) : (
          <div style={{ height: `${Math.max(240, grafico.length * 34)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafico} layout="vertical" margin={{ left: 12, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" h" />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={190}
                  tick={{ fontSize: 11, fill: '#cbd5e1' }}
                />
                <Tooltip
                  formatter={(v: number) => [`${v} h`, 'Horas']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                {/* Sin animacion: al animarse, las barras conservan la
                    geometria del contenedor anterior cuando este cambia de
                    ancho, y quedan dibujadas a una escala que no corresponde. */}
                <Bar
                  dataKey="horas"
                  fill="#38bdf8"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </Marco>
  );
}

function Indicador({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur">
      <p className="text-xs text-slate-400">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold text-white">{valor}</p>
    </div>
  );
}
