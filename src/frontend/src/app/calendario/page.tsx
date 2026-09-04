'use client';

import { useCallback, useEffect, useState } from 'react';
import Marco from '@/components/Marco';
import { api } from '@/lib/api';
import { DiaCalendario, SesionDelDia } from '@/lib/tipos';
import { duracion, hora } from '@/lib/formato';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

/** US-07 — calendario mensual con la intensidad de horas por dia. */
export default function Calendario() {
  const hoy = new Date();
  const [ancla, setAncla] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [dias, setDias] = useState<DiaCalendario[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<SesionDelDia[]>([]);

  const cargar = useCallback(async () => {
    const desde = new Date(ancla.getFullYear(), ancla.getMonth(), 1);
    const hasta = new Date(ancla.getFullYear(), ancla.getMonth() + 1, 1);
    setDias(
      await api.get<DiaCalendario[]>(
        `/reportes/calendario?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`,
      ),
    );
  }, [ancla]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function abrirDia(fecha: string) {
    setSeleccionado(fecha);
    setDetalle(await api.get<SesionDelDia[]>(`/reportes/dia?fecha=${fecha}`));
  }

  // Celdas del mes, alineadas a una semana que parte el lunes.
  const primero = new Date(ancla.getFullYear(), ancla.getMonth(), 1);
  const relleno = (primero.getDay() + 6) % 7;
  const total = new Date(ancla.getFullYear(), ancla.getMonth() + 1, 0).getDate();
  const porDia = new Map(dias.map((d) => [d.dia, d]));
  const maximo = Math.max(1, ...dias.map((d) => d.segundos));
  const totalMes = dias.reduce((t, d) => t + d.segundos, 0);

  function clave(n: number) {
    const m = String(ancla.getMonth() + 1).padStart(2, '0');
    return `${ancla.getFullYear()}-${m}-${String(n).padStart(2, '0')}`;
  }

  return (
    <Marco
      activo="/calendario"
      titulo="Calendario"
      subtitulo="Horas registradas por dia"
      acciones={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAncla(new Date(ancla.getFullYear(), ancla.getMonth() - 1, 1))}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-white"
          >
            ‹
          </button>
          <span className="min-w-40 text-center text-sm font-semibold">
            {MESES[ancla.getMonth()]} {ancla.getFullYear()}
          </span>
          <button
            onClick={() => setAncla(new Date(ancla.getFullYear(), ancla.getMonth() + 1, 1))}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-white"
          >
            ›
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total del mes: <strong className="text-slate-800">{duracion(totalMes)}</strong>
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              menos
              <span className="h-3 w-3 rounded bg-emerald-100" />
              <span className="h-3 w-3 rounded bg-emerald-300" />
              <span className="h-3 w-3 rounded bg-emerald-500" />
              <span className="h-3 w-3 rounded bg-emerald-700" />
              mas
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1.5">
            {DIAS.map((d) => (
              <div key={d} className="pb-1 text-center text-[11px] font-medium text-slate-400">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: relleno }).map((_, i) => (
              <div key={`v${i}`} />
            ))}

            {Array.from({ length: total }).map((_, i) => {
              const n = i + 1;
              const k = clave(n);
              const dato = porDia.get(k);
              const razon = dato ? dato.segundos / maximo : 0;
              const fondo =
                !dato ? 'bg-slate-50 text-slate-300'
                : razon > 0.75 ? 'bg-emerald-700 text-white'
                : razon > 0.5 ? 'bg-emerald-500 text-white'
                : razon > 0.25 ? 'bg-emerald-300 text-emerald-900'
                : 'bg-emerald-100 text-emerald-800';

              return (
                <button
                  key={k}
                  onClick={() => dato && abrirDia(k)}
                  disabled={!dato}
                  className={`aspect-square rounded-lg p-1.5 text-left transition ${fondo} ${
                    dato ? 'hover:ring-2 hover:ring-orange-300' : 'cursor-default'
                  } ${seleccionado === k ? 'ring-2 ring-orange-400' : ''}`}
                >
                  <span className="text-xs font-semibold">{n}</span>
                  {dato && (
                    <span className="mt-0.5 block text-[10px] leading-tight opacity-90">
                      {(dato.segundos / 3600).toFixed(1)} h
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 lg:w-96">
          <h2 className="mb-1 font-bold text-slate-800">
            {seleccionado ? `Detalle del ${seleccionado}` : 'Detalle del dia'}
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            {seleccionado
              ? `${detalle.length} sesion(es) registrada(s)`
              : 'Selecciona un dia con registro para ver sus sesiones.'}
          </p>

          <div className="flex flex-col gap-2">
            {detalle.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug text-slate-800">
                    {s.actividad}
                  </p>
                  <span className="shrink-0 font-mono text-xs text-slate-500">
                    {duracion(s.segundos)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {s.trabajador} · {hora(s.inicioEn)}
                  {s.terminoEn ? ` – ${hora(s.terminoEn)}` : ' – en curso'}
                </p>
                {s.notaCierre && (
                  <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                    {s.notaCierre}
                  </p>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Marco>
  );
}
