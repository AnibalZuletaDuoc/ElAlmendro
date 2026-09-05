'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ErrorApi, Usuario } from '@/lib/api';
import { iniciales } from '@/lib/formato';
import { ContextoSesion } from '@/lib/sesion';

const SECCIONES = [
  { href: '/panel', texto: 'Mis actividades' },
  { href: '/calendario', texto: 'Calendario' },
  { href: '/nodos', texto: 'Mapa de nodos' },
  { href: '/reportes', texto: 'Reportes' },
];

/**
 * Marco comun de la aplicacion: barra lateral, cabecera y control de sesion.
 *
 * Verifica la sesion en un solo lugar. Si la cookie expiro, cualquier pantalla
 * devuelve al inicio de sesion sin repetir esa logica en cada una.
 */
export default function Marco({
  activo,
  titulo,
  subtitulo,
  acciones,
  children,
}: {
  activo: string;
  titulo: string;
  subtitulo?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setUsuario(await api.get<Usuario>('/auth/yo'));
      } catch (err) {
        if (err instanceof ErrorApi && err.estado === 401) {
          router.replace('/login');
          return;
        }
      } finally {
        setListo(true);
      }
    })();
  }, [router]);

  async function salir() {
    await api.post('/auth/logout');
    router.replace('/login');
  }

  if (!listo) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#faf7f2] text-sm text-slate-400">
        Cargando…
      </main>
    );
  }

  // El provider envuelve todo el marco, no solo el contenido: `acciones` se
  // pinta en la cabecera y tambien necesita saber quien inicio sesion.
  return (
    <ContextoSesion.Provider value={usuario}>
      <div className="flex min-h-screen bg-[#faf7f2] text-slate-800">
        <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-slate-200/70 bg-white/60 p-4 md:flex">
          <div className="mb-4 flex items-center gap-3 px-2 py-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 font-bold text-white">
              T
            </div>
            <div>
              <p className="font-bold leading-tight text-slate-800">TimeFlow</p>
              <p className="text-[11px] text-slate-400">Jornada · Actividades</p>
            </div>
          </div>

          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`rounded-xl px-3 py-2.5 text-sm transition ${
                activo === s.href
                  ? 'bg-orange-50 font-semibold text-orange-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.texto}
            </Link>
          ))}

          <div className="mt-auto border-t border-slate-200 pt-3">
            <p className="px-3 text-xs font-medium text-slate-600">
              {usuario?.nombreCompleto}
            </p>
            <p className="mb-2 px-3 text-[11px] text-slate-400">
              {usuario?.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Trabajador'}
            </p>
            <button
              onClick={salir}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-100"
            >
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-3 border-b border-slate-200/70 bg-white/60 px-6 py-4">
            <div className="min-w-0">
              <h1 className="truncate font-bold text-slate-800">{titulo}</h1>
              {subtitulo && <p className="text-xs text-slate-400">{subtitulo}</p>}
            </div>
            <div className="ml-auto flex items-center gap-3">
              {acciones}
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700"
                title={usuario?.nombreCompleto}
              >
                {iniciales(usuario?.nombreCompleto ?? '')}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>
        </div>
      </div>
    </ContextoSesion.Provider>
  );
}
