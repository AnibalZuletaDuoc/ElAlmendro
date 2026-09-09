'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Marco from '@/components/Marco';
import { api, ErrorApi, ProyectoItem } from '@/lib/api';

/** Proyectos del trabajador: cada uno es la raiz de su propio mapa de nodos. */
export default function Panel() {
  const router = useRouter();

  const [proyectos, setProyectos] = useState<ProyectoItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ProyectoItem | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const lista = await api.get<ProyectoItem[]>('/proyectos/mios');
    setProyectos(lista);
  }, []);

  useEffect(() => {
    setCargando(true);
    cargar()
      .catch((err) => {
        if (err instanceof ErrorApi && err.estado === 401) router.replace('/login');
        else setAviso('No se pudo conectar con el servidor.');
      })
      .finally(() => setCargando(false));
  }, [cargar, router]);

  const proyecto = proyectos.find((p) => p.id === seleccionado) ?? null;

  function irATareas(p: ProyectoItem) {
    router.push(`/nodos?proyectoId=${p.id}&nombre=${encodeURIComponent(p.nombre)}`);
  }

  return (
    <Marco activo="/panel" titulo="Proyectos">
      {aviso && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300"
        >
          {aviso}
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className="min-w-0 flex-1">
          {cargando ? (
            <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-500">
              Cargando proyectos…
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {proyectos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSeleccionado(p.id)}
                  className={`rounded-2xl border bg-slate-900/60 p-4 text-left backdrop-blur transition hover:bg-slate-900 ${
                    seleccionado === p.id
                      ? 'border-sky-400/50 ring-2 ring-sky-400/20'
                      : 'border-white/10'
                  }`}
                >
                  <p className="mb-1 font-semibold leading-snug text-white">{p.nombre}</p>
                  <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                    {p.descripcion || 'Sin descripción'}
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                    {p.totalTareas} tarea{p.totalTareas === 1 ? '' : 's'}
                  </span>
                </button>
              ))}

              <button
                onClick={() => setModalAbierto(true)}
                className="flex min-h-[7.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/15 p-4 text-slate-400 transition hover:border-sky-400/40 hover:text-sky-300"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-sm font-medium">Crear proyecto</span>
              </button>
            </div>
          )}
        </section>

        {proyecto && (
          <aside className="w-full shrink-0 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur lg:w-96">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-bold leading-snug text-white">{proyecto.nombre}</h2>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setEditando(proyecto)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Editar
                </button>
                <button
                  onClick={() => setSeleccionado(null)}
                  aria-label="Cerrar detalle"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/5"
                >
                  ×
                </button>
              </div>
            </div>

            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Descripción
            </p>
            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              {proyecto.descripcion || 'Sin descripción'}
            </p>

            <Fila
              etiqueta="Creado el"
              valor={new Date(proyecto.creadoEn).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Fila
              etiqueta="Tareas asociadas"
              valor={`${proyecto.totalTareas} tarea${proyecto.totalTareas === 1 ? '' : 's'}`}
            />

            <button
              onClick={() => irATareas(proyecto)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-400"
            >
              Ir a las tareas
            </button>
          </aside>
        )}
      </div>

      {modalAbierto && (
        <ModalCrearProyecto
          onCerrar={() => setModalAbierto(false)}
          onCreado={async () => {
            setModalAbierto(false);
            await cargar();
          }}
        />
      )}

      {editando && (
        <ModalEditarProyecto
          proyecto={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={async () => {
            setEditando(null);
            await cargar();
          }}
        />
      )}
    </Marco>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 text-sm">
      <span className="text-slate-400">{etiqueta}</span>
      <span className="font-medium text-white">{valor}</span>
    </div>
  );
}

function ModalCrearProyecto({
  onCerrar,
  onCreado,
}: {
  onCerrar: () => void;
  onCreado: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await api.post('/proyectos', {
        nombre,
        descripcion: descripcion || undefined,
      });
      await onCreado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo crear el proyecto.');
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white">Crear proyecto</h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Nombre</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej: Sitio web corporativo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Descripción <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="De qué trata este proyecto"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50"
            >
              {enviando ? 'Creando…' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalEditarProyecto({
  proyecto,
  onCerrar,
  onGuardado,
}: {
  proyecto: ProyectoItem;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState(proyecto.nombre);
  const [descripcion, setDescripcion] = useState(proyecto.descripcion ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await api.patch(`/proyectos/${proyecto.id}`, {
        nombre,
        descripcion: descripcion || undefined,
      });
      await onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo actualizar el proyecto.');
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white">Editar proyecto</h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Nombre</label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Descripción <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50"
            >
              {enviando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
