'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Marco from '@/components/Marco';
import { api } from '@/lib/api';
import { Derivacion, NodoActividad } from '@/lib/tipos';
import { ESTADOS } from '@/lib/formato';

const COLOR: Record<string, string> = {
  PENDIENTE: '#0ea5e9',
  EN_PROGRESO: '#f59e0b',
  BLOQUEADA: '#f43f5e',
  INCONCLUSA: '#f97316',
  COMPLETADA: '#10b981',
  CANCELADA: '#94a3b8',
};

/** US-05 y US-06 — mapa de nodos y registro de derivaciones. */
export default function Nodos() {
  const [actividades, setActividades] = useState<NodoActividad[]>([]);
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);

  useEffect(() => {
    (async () => {
      const d = await api.get<{
        actividades: NodoActividad[];
        derivaciones: Derivacion[];
      }>('/nodos');
      setActividades(d.actividades);
      setDerivaciones(d.derivaciones);
    })();
  }, []);

  const { nodos, aristas } = useMemo(() => {
    // Las agrupaciones se disponen en columnas y sus hijas debajo. Cuando la
    // actividad ya trae posicion guardada, se respeta la del usuario.
    const padres = actividades.filter((a) => !a.actividadPadreId);

    const nodos: Node[] = actividades.map((a) => {
      const esPadre = !a.actividadPadreId;
      const guardada = a.posicionNodo;
      const iPadre = padres.findIndex((p) => p.id === a.actividadPadreId);
      const hermanas = actividades.filter((x) => x.actividadPadreId === a.actividadPadreId);
      const iHermana = hermanas.findIndex((x) => x.id === a.id);

      return {
        id: a.id,
        position: guardada ?? {
          x: (esPadre ? padres.findIndex((p) => p.id === a.id) : iPadre) * 300,
          y: esPadre ? 0 : 130 + iHermana * 105,
        },
        data: {
          label: (
            <div className="px-1 py-0.5 text-left">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLOR[a.estado] ?? '#94a3b8' }}
                />
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {(ESTADOS[a.estado] ?? ESTADOS.PENDIENTE).texto}
                </span>
              </div>
              <p className="text-xs font-semibold leading-snug text-slate-800">
                {a.titulo}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {a.responsable.nombreCompleto}
              </p>
            </div>
          ),
        },
        style: {
          width: 220,
          borderRadius: 14,
          border: `1px solid ${esPadre ? '#cbd5e1' : '#e2e8f0'}`,
          background: esPadre ? '#f8fafc' : '#ffffff',
          padding: 8,
          boxShadow: '0 1px 2px rgba(15,23,42,.06)',
        },
      };
    });

    const aristas: Edge[] = actividades
      .filter((a) => a.actividadPadreId)
      .map((a) => ({
        id: `${a.actividadPadreId}-${a.id}`,
        source: a.actividadPadreId!,
        target: a.id,
        style: { stroke: '#cbd5e1' },
      }));

    return { nodos, aristas };
  }, [actividades]);

  return (
    <Marco
      activo="/nodos"
      titulo="Mapa de nodos"
      subtitulo="Flujo de actividades y derivaciones"
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div style={{ height: '32rem' }}>
            <ReactFlow
              nodes={nodos}
              edges={aristas}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#e2e8f0" gap={18} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </section>

        <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 lg:w-80">
          <h2 className="mb-1 font-bold text-slate-800">Derivaciones</h2>
          <p className="mb-4 text-xs text-slate-400">
            Traspasos de responsable, con su motivo y su fecha.
          </p>

          {derivaciones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
              Sin derivaciones registradas.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {derivaciones.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold leading-snug text-slate-800">
                    {d.actividad.titulo}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {d.deUsuario.nombreCompleto} → {d.aUsuario.nombreCompleto}
                  </p>
                  <p className="mt-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                    {d.motivo}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(d.ocurridoEn).toLocaleDateString('es-CL')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </Marco>
  );
}
