'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Marco from '@/components/Marco';
import { api, Actividad, ErrorApi, Jornada, Sesion } from '@/lib/api';
import { cronometro, duracion, ESTADOS, hora, PRIORIDADES } from '@/lib/formato';

export default function Panel() {
  const router = useRouter();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [nota, setNota] = useState('');

  // ------------------------------------------------------------------ datos

  const cargar = useCallback(async () => {
    const [acts, jor, ses] = await Promise.all([
      api.get<Actividad[]>('/actividades/mias'),
      api.get<Jornada | null>('/jornadas/actual'),
      api.get<Sesion | null>('/sesiones/activa'),
    ]);
    setActividades(acts);
    setJornada(jor);
    setSesion(ses);
    setSegundos(ses?.segundosAcumulados ?? 0);
  }, []);

  useEffect(() => {
    cargar().catch((err) => {
      if (err instanceof ErrorApi && err.estado === 401) router.replace('/login');
      else setAviso('No se pudo conectar con el servidor.');
    });
  }, [cargar, router]);

  /**
   * El cronometro visible se calcula sobre los segundos que devolvio la API.
   * Es un calculo de presentacion: este valor no vuelve nunca al servidor.
   */
  useEffect(() => {
    if (sesion?.estado !== 'ACTIVA') return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [sesion?.estado, sesion?.id]);

  async function accion(fn: () => Promise<unknown>) {
    setAviso(null);
    try {
      await fn();
      await cargar();
    } catch (err) {
      setAviso(err instanceof ErrorApi ? err.message : 'Ocurrio un error.');
    }
  }

  // ------------------------------------------------------------------ vista

  const actividad = actividades.find((a) => a.id === seleccionada) ?? null;
  const enJornada = Boolean(jornada);
  const totalSeg = actividades.reduce((t, a) => t + a.segundosTrabajados, 0);
  const completadas = actividades.filter((a) => a.estado === 'COMPLETADA').length;
  const avance = actividades.length
    ? Math.round((completadas / actividades.length) * 100)
    : 0;

  return (
    <Marco
      activo="/panel"
      titulo="Mis actividades"
      subtitulo={
        actividades[0]?.proyecto.nombre
          ? `${actividades[0].proyecto.nombre} · ${avance}% completado · ${duracion(totalSeg)} registradas`
          : 'Sin actividades asignadas'
      }
      acciones={
        <>
          {enJornada ? (
            <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              En jornada desde {hora(jornada!.inicioEn)}
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
              Fuera de jornada
            </span>
          )}

          <button
            onClick={() =>
              accion(() =>
                api.post(enJornada ? '/jornadas/salida' : '/jornadas/entrada'),
              )
            }
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              enJornada
                ? 'bg-slate-700 hover:bg-slate-800'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {enJornada ? 'Marcar salida' : 'Marcar entrada'}
          </button>
        </>
      }
    >
      {aviso && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
        >
          {aviso}
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* ------------------------------------ tarjetas de actividad */}
        <section className="min-w-0 flex-1">
          {actividades.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
              No tienes actividades asignadas.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {actividades.map((a) => {
                const est = ESTADOS[a.estado] ?? ESTADOS.PENDIENTE;
                const corriendo = sesion?.actividad.id === a.id;
                const hechas = a.subtareas.filter((s) => s.completada).length;
                const progreso = a.subtareas.length
                  ? Math.round((hechas / a.subtareas.length) * 100)
                  : a.estado === 'COMPLETADA'
                    ? 100
                    : 0;

                return (
                  <button
                    key={a.id}
                    onClick={() => setSeleccionada(a.id)}
                    className={`rounded-2xl border bg-white p-4 text-left transition hover:shadow-md ${
                      seleccionada === a.id
                        ? 'border-orange-300 ring-2 ring-orange-100'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${est.clase}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${est.punto}`} />
                        {est.texto}
                      </span>
                      {corriendo && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                          corriendo
                        </span>
                      )}
                    </div>

                    <p className="mb-1 font-semibold leading-snug text-slate-800">
                      {a.titulo}
                    </p>
                    <p className="mb-3 text-xs text-slate-400">
                      {duracion(a.segundosTrabajados)}
                      {a.minutosEstimados
                        ? ` de ${duracion(a.minutosEstimados * 60)} estimadas`
                        : ''}
                    </p>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          a.estado === 'COMPLETADA' ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ------------------------------------ panel de detalle */}
        {actividad && (
          <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 lg:w-96">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-bold leading-snug text-slate-800">
                {actividad.titulo}
              </h2>
              <button
                onClick={() => setSeleccionada(null)}
                aria-label="Cerrar detalle"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <Fila etiqueta="Asignado a" valor={actividad.responsable.nombreCompleto} />
            <Fila
              etiqueta="Estado"
              valor={
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    (ESTADOS[actividad.estado] ?? ESTADOS.PENDIENTE).clase
                  }`}
                >
                  {(ESTADOS[actividad.estado] ?? ESTADOS.PENDIENTE).texto}
                </span>
              }
            />
            <Fila
              etiqueta="Prioridad"
              valor={
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    PRIORIDADES[actividad.prioridad] ?? ''
                  }`}
                >
                  {actividad.prioridad}
                </span>
              }
            />
            <Fila
              etiqueta="Tiempo acumulado"
              valor={duracion(actividad.segundosTrabajados)}
            />

            {/* ------------------------------ cronometro */}
            <div className="my-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {sesion?.actividad.id === actividad.id
                  ? sesion.estado === 'ACTIVA'
                    ? 'Sesion en curso'
                    : 'Sesion en pausa'
                  : 'Sin sesion iniciada'}
              </p>
              <p
                className={`my-1 font-mono text-3xl font-bold tabular-nums ${
                  sesion?.actividad.id === actividad.id
                    ? 'text-slate-800'
                    : 'text-slate-300'
                }`}
              >
                {cronometro(sesion?.actividad.id === actividad.id ? segundos : 0)}
              </p>
              <p className="text-[11px] text-slate-400">
                Cronometrado por el servidor
              </p>
            </div>

            {sesion?.actividad.id !== actividad.id ? (
              <button
                onClick={() =>
                  accion(() =>
                    api.post('/sesiones/iniciar', { actividadId: actividad.id }),
                  )
                }
                disabled={actividad.estado === 'COMPLETADA'}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Comenzar
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      accion(() =>
                        api.post(
                          `/sesiones/${sesion.id}/${
                            sesion.estado === 'ACTIVA' ? 'pausar' : 'reanudar'
                          }`,
                        ),
                      )
                    }
                    className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {sesion.estado === 'ACTIVA' ? 'Pausar' : 'Reanudar'}
                  </button>
                  <button
                    onClick={() => setCerrando(true)}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Terminar
                  </button>
                </div>

                {cerrando && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-medium text-slate-600">
                      Como dejas la actividad?
                    </p>
                    <textarea
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      rows={2}
                      placeholder="Nota de cierre (obligatoria si queda inconclusa)"
                      className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-orange-400"
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
                        className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
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
                        className="flex-1 rounded-lg bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                      >
                        Inconclusa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {actividad.descripcion && (
              <>
                <p className="mt-5 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Descripcion
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  {actividad.descripcion}
                </p>
              </>
            )}

            {actividad.subtareas.length > 0 && (
              <>
                <p className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Subtareas ({actividad.subtareas.filter((s) => s.completada).length}
                  /{actividad.subtareas.length})
                </p>
                <ul className="flex flex-col gap-1.5">
                  {actividad.subtareas.map((s) => (
                    <li
                      key={s.id}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        s.completada
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          s.completada ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      {s.titulo}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        )}
      </div>
    </Marco>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
      <span className="text-slate-500">{etiqueta}</span>
      <span className="font-medium text-slate-800">{valor}</span>
    </div>
  );
}
