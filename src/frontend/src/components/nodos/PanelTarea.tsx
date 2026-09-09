'use client';

import { useEffect, useRef, useState } from 'react';
import { Actividad, api, Evidencia, ErrorApi, Sesion, URL_API } from '@/lib/api';
import { cronometro, duracion, ESTADOS, PRIORIDADES } from '@/lib/formato';

/**
 * Detalle de una tarea del mapa de nodos: cronometraje (comenzar, pausar,
 * reanudar, terminar) y evidencias adjuntas. Ocupa el lugar de
 * "Derivaciones" mientras hay una tarea seleccionada.
 */
export default function PanelTarea({
  actividadId,
  onCerrar,
  onCambio,
}: {
  actividadId: string;
  onCerrar: () => void;
  /** Avisa al mapa que recargue: el estado de la tarea cambio (color del nodo). */
  onCambio?: () => void;
}) {
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [segundos, setSegundos] = useState(0);
  const [cerrando, setCerrando] = useState(false);
  const [nota, setNota] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  async function cargar() {
    const [a, s, ev] = await Promise.all([
      api.get<Actividad>(`/actividades/${actividadId}`),
      api.get<Sesion | null>('/sesiones/activa'),
      api.get<Evidencia[]>(`/evidencias?actividadId=${actividadId}`),
    ]);
    setActividad(a);
    setSesion(s);
    setEvidencias(ev);
    setSegundos(s?.actividad.id === actividadId ? s.segundosAcumulados : 0);
  }

  useEffect(() => {
    setCerrando(false);
    setNota('');
    setAviso(null);
    cargar().catch(() => setAviso('No se pudo cargar la tarea.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividadId]);

  useEffect(() => {
    if (sesion?.actividad.id !== actividadId || sesion.estado !== 'ACTIVA') return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [sesion, actividadId]);

  async function accion(fn: () => Promise<unknown>) {
    setAviso(null);
    try {
      await fn();
      await cargar();
      onCambio?.();
    } catch (err) {
      setAviso(err instanceof ErrorApi ? err.message : 'Ocurrio un error.');
    }
  }

  async function subirArchivo(archivo: File) {
    setAviso(null);
    setSubiendo(true);
    try {
      const formulario = new FormData();
      formulario.append('archivo', archivo);
      formulario.append('actividadId', actividadId);
      await api.subirArchivo('/evidencias', formulario);
      setEvidencias(await api.get<Evidencia[]>(`/evidencias?actividadId=${actividadId}`));
    } catch (err) {
      setAviso(err instanceof ErrorApi ? err.message : 'No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
      if (inputArchivo.current) inputArchivo.current.value = '';
    }
  }

  if (!actividad) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-500 backdrop-blur">
        Cargando tarea…
      </div>
    );
  }

  const estado = ESTADOS[actividad.estado] ?? ESTADOS.PENDIENTE;
  const enEstaTarea = sesion?.actividad.id === actividadId;
  const terminada = actividad.estado === 'COMPLETADA';

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="font-bold leading-snug text-white">{actividad.titulo}</h2>
        <button
          onClick={onCerrar}
          aria-label="Cerrar detalle"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/5"
        >
          ×
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${estado.clase}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
          {estado.texto}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORIDADES[actividad.prioridad] ?? ''}`}
        >
          {actividad.prioridad}
        </span>
      </div>

      {actividad.descripcion && (
        <p className="mb-4 text-sm leading-relaxed text-slate-300">{actividad.descripcion}</p>
      )}

      {aviso && (
        <p role="alert" className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {aviso}
        </p>
      )}

      {/* ------------------------------ cronometro */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {enEstaTarea
            ? sesion!.estado === 'ACTIVA'
              ? 'Cronometro en marcha'
              : 'Cronometro en pausa'
            : 'Cronometro detenido'}
        </p>
        <p className={`my-1 font-mono text-3xl font-bold tabular-nums ${enEstaTarea ? 'text-white' : 'text-slate-600'}`}>
          {cronometro(enEstaTarea ? segundos : 0)}
        </p>
        <p className="text-[11px] text-slate-400">
          Total acumulado: {duracion(actividad.segundosTrabajados)}
        </p>
      </div>

      {!sesion ? (
        <button
          onClick={() => accion(() => api.post('/sesiones/iniciar', { actividadId }))}
          disabled={terminada}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Comenzar
        </button>
      ) : !enEstaTarea ? (
        <p className="rounded-xl border border-dashed border-white/15 p-3 text-center text-xs text-slate-500">
          Tienes otra sesion abierta en &quot;{sesion.actividad.titulo}&quot;. Ciérrala para
          cronometrar esta tarea.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() =>
                accion(() =>
                  api.post(`/sesiones/${sesion.id}/${sesion.estado === 'ACTIVA' ? 'pausar' : 'reanudar'}`),
                )
              }
              className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
            >
              {sesion.estado === 'ACTIVA' ? 'Pausar' : 'Reanudar'}
            </button>
            <button
              onClick={() => setCerrando(true)}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Terminar
            </button>
          </div>

          {cerrando && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs font-medium text-slate-300">Como dejas la tarea?</p>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
                placeholder="Nota de cierre (obligatoria si queda inconclusa)"
                className="mb-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    accion(async () => {
                      await api.post(`/sesiones/${sesion.id}/cerrar`, {
                        desenlace: 'COMPLETADA',
                        notaCierre: nota || undefined,
                      });
                      setCerrando(false);
                      setNota('');
                    })
                  }
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Completada
                </button>
                <button
                  onClick={() =>
                    accion(async () => {
                      await api.post(`/sesiones/${sesion.id}/cerrar`, {
                        desenlace: 'INCONCLUSA',
                        notaCierre: nota,
                      });
                      setCerrando(false);
                      setNota('');
                    })
                  }
                  className="flex-1 rounded-lg bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-400"
                >
                  Inconclusa
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ evidencias */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Archivos adjuntos
          </p>
          {!terminada && (
            <button
              onClick={() => inputArchivo.current?.click()}
              disabled={subiendo}
              className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 disabled:opacity-50"
            >
              {subiendo ? 'Subiendo…' : '+ Adjuntar'}
            </button>
          )}
          <input
            ref={inputArchivo}
            type="file"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subirArchivo(archivo);
            }}
          />
        </div>

        {evidencias.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-slate-500">
            {terminada ? 'Tarea completada sin archivos adjuntos.' : 'Sin archivos adjuntos.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {evidencias.map((ev) => (
              <li key={ev.id}>
                <a
                  href={`${URL_API}/evidencias/${ev.id}/descargar`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  <span className="truncate">{ev.nombreArchivo}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-slate-500">
                    {(ev.tamanoBytes / 1024).toFixed(0)} KB
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
