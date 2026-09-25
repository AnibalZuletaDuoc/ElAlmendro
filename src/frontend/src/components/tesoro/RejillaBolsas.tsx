'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { ESTADOS, PRIORIDADES } from '@/lib/formato';
import { NodoActividad } from '@/lib/tipos';
import { useTesoro } from '@/lib/tesoro';
import BolsaOro from './BolsaOro';

type Filtro = 'todas' | 'en_curso' | 'guardadas' | 'alta';

const FILTROS: { clave: Filtro; texto: string }[] = [
  { clave: 'todas', texto: 'Todas' },
  { clave: 'en_curso', texto: 'En curso' },
  { clave: 'guardadas', texto: 'Guardadas' },
  { clave: 'alta', texto: 'Prioridad alta' },
];

/** Cuanto oro tiene la bolsa: sus monedas marcadas, o su estado si no tiene. */
export function llenadoDeBolsa(a: Pick<NodoActividad, 'estado' | 'monedas' | 'monedasListas'>) {
  if (a.estado === 'COMPLETADA') return 1;
  if (a.monedas > 0) return a.monedasListas / a.monedas;
  return a.estado === 'EN_PROGRESO' ? 0.45 : 0.08;
}

/**
 * Las bolsas de un proyecto. Cada tarea es una bolsa que se va llenando con
 * sus monedas; al tocarla se abre en la ventana flotante, donde se cronometra
 * y se guarda en el cofre.
 */
export default function RejillaBolsas({ proyectoId }: { proyectoId: string }) {
  const { abrirBolsa, bolsa, version } = useTesoro();
  const [actividades, setActividades] = useState<NodoActividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    const d = await api.get<{ actividades: NodoActividad[] }>(`/nodos?proyectoId=${proyectoId}`);
    setActividades(d.actividades);
  }, [proyectoId]);

  useEffect(() => {
    setCargando(true);
    cargar()
      .catch(() => setActividades([]))
      .finally(() => setCargando(false));
    // `version` cambia cuando la ventana flotante guarda o marca algo.
  }, [cargar, version]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return actividades
      .filter((a) => {
        if (q && !a.titulo.toLowerCase().includes(q)) return false;
        if (filtro === 'guardadas') return a.estado === 'COMPLETADA';
        if (filtro === 'en_curso') return a.estado !== 'COMPLETADA' && a.estado !== 'CANCELADA';
        if (filtro === 'alta') return a.prioridad === 'ALTA' || a.prioridad === 'CRITICA';
        return true;
      })
      .sort((a, b) => {
        // Las guardadas al final: lo pendiente es lo que se mira.
        const ga = a.estado === 'COMPLETADA' ? 1 : 0;
        const gb = b.estado === 'COMPLETADA' ? 1 : 0;
        return ga - gb || llenadoDeBolsa(b) - llenadoDeBolsa(a);
      });
  }, [actividades, filtro, busqueda]);

  const guardadas = actividades.filter((a) => a.estado === 'COMPLETADA').length;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-white">
            Las bolsas de este proyecto
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
              {actividades.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Cada tarea es una bolsa. Llénala con sus monedas y guárdala en el cofre.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar una bolsa…"
            className="w-44 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50"
          />
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
            {guardadas} en el cofre
          </span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.clave}
            onClick={() => setFiltro(f.clave)}
            className={`rounded-lg px-3 py-1 text-xs transition ${
              filtro === f.clave
                ? 'bg-amber-500/20 font-semibold text-amber-200'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-xs text-slate-500">
          {actividades.length === 0
            ? 'Este proyecto todavía no tiene bolsas. Créalas desde el mapa de nodos.'
            : 'Ninguna bolsa coincide con este filtro.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((a) => {
            const llenado = llenadoDeBolsa(a);
            const estado = ESTADOS[a.estado] ?? ESTADOS.PENDIENTE;
            const activa = bolsa?.id === a.id;
            return (
              <button
                key={a.id}
                onClick={() => abrirBolsa({ id: a.id, titulo: a.titulo })}
                className={`flex items-center gap-3 rounded-2xl border bg-slate-900/60 p-3 text-left backdrop-blur transition hover:bg-slate-900 ${
                  activa
                    ? 'border-amber-400/60 ring-2 ring-amber-400/20'
                    : 'border-white/10 hover:border-amber-400/30'
                }`}
              >
                <BolsaOro llenado={llenado} tamano={58} guardada={a.estado === 'COMPLETADA'} />
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PRIORIDADES[a.prioridad] ?? ''}`}
                    >
                      {a.prioridad}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] ${estado.clase.split(' ')[0]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
                      {estado.texto}
                    </span>
                  </span>
                  <span className="block truncate text-sm font-semibold text-white">{a.titulo}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-500"
                        style={{ width: `${llenado * 100}%` }}
                      />
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-amber-300">
                      {Math.round(llenado * 100)}%
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {a.monedas > 0
                      ? `${a.monedasListas}/${a.monedas} monedas · ${a.responsable.nombreCompleto}`
                      : a.responsable.nombreCompleto}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
