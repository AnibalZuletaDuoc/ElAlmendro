'use client';

import { useEffect, useState } from 'react';
import { api, ErrorApi, MiembroProyecto, PersonaRef } from '@/lib/api';

/**
 * Equipo de un proyecto. Todos lo ven; administrador y supervisor ademas
 * agregan o quitan personas. Ser miembro es lo que hace que el proyecto
 * aparezca en "Mis proyectos" del trabajador.
 */
export default function EquipoProyecto({
  proyectoId,
  puedeGestionar,
}: {
  proyectoId: string;
  puedeGestionar: boolean;
}) {
  const [miembros, setMiembros] = useState<MiembroProyecto[]>([]);
  const [personas, setPersonas] = useState<PersonaRef[]>([]);
  const [elegido, setElegido] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setAviso(null);
    api
      .get<MiembroProyecto[]>(`/proyectos/${proyectoId}/miembros`)
      .then((m) => vigente && setMiembros(m))
      .catch(() => vigente && setAviso('No se pudo cargar el equipo.'));
    if (puedeGestionar) {
      api
        .get<PersonaRef[]>('/usuarios/trabajadores')
        .then((p) => vigente && setPersonas(p))
        .catch(() => undefined);
    }
    return () => {
      vigente = false;
    };
  }, [proyectoId, puedeGestionar]);

  const disponibles = personas.filter((p) => !miembros.some((m) => m.id === p.id));

  async function ejecutar(fn: () => Promise<MiembroProyecto[]>) {
    setAviso(null);
    setOcupado(true);
    try {
      setMiembros(await fn());
      setElegido('');
    } catch (err) {
      setAviso(err instanceof ErrorApi ? err.message : 'No se pudo actualizar el equipo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Equipo
      </p>

      {aviso && (
        <p role="alert" className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {aviso}
        </p>
      )}

      {miembros.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-3 text-center text-xs text-slate-500">
          Nadie asignado todavia.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {miembros.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{m.nombre}</p>
                <p className="text-[11px] text-slate-400">
                  {m.rolEnProyecto === 'LIDER' ? 'Lider del proyecto' : 'Miembro'}
                  {!m.activo && ' · desactivado'}
                </p>
              </div>
              {puedeGestionar && m.rolEnProyecto !== 'LIDER' && (
                <button
                  onClick={() =>
                    ejecutar(() =>
                      api.delete<MiembroProyecto[]>(`/proyectos/${proyectoId}/miembros/${m.id}`),
                    )
                  }
                  disabled={ocupado}
                  aria-label={`Quitar a ${m.nombre}`}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 text-xs text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-50"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {puedeGestionar && (
        <div className="mt-2 flex gap-2">
          <select
            value={elegido}
            onChange={(e) => setElegido(e.target.value)}
            disabled={ocupado || disponibles.length === 0}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50 disabled:opacity-50"
          >
            <option value="">
              {disponibles.length === 0 ? 'Todo el equipo ya esta asignado' : 'Agregar persona…'}
            </option>
            {disponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              ejecutar(() =>
                api.post<MiembroProyecto[]>(`/proyectos/${proyectoId}/miembros`, {
                  usuarioId: elegido,
                }),
              )
            }
            disabled={ocupado || !elegido}
            className="shrink-0 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            Asignar
          </button>
        </div>
      )}
    </div>
  );
}
