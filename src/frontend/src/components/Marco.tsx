'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PERMISOS, PermisoCodigo } from '@/lib/rbac';
import { api, ErrorApi, Jornada, Usuario } from '@/lib/api';
import { iniciales } from '@/lib/formato';
import { ContextoSesion } from '@/lib/sesion';

interface SeccionNav {
  href: string;
  texto: string;
  permisoRequerido?: PermisoCodigo;
}

const SECCIONES: SeccionNav[] = [
  {
    href: '/panel',
    texto: 'Proyectos',
    permisoRequerido: PERMISOS.ACTIVIDADES_VER_PROPIAS,
  },
  {
    href: '/calendario',
    texto: 'Calendario',
    permisoRequerido: PERMISOS.CALENDARIO_VER_PROPIO,
  },
  {
    href: '/nodos',
    texto: 'Mapa de nodos',
    permisoRequerido: PERMISOS.NODOS_VER_MAPA,
  },
  {
    href: '/reportes',
    texto: 'Reportes',
    permisoRequerido: PERMISOS.REPORTES_VER_EQUIPO,
  },
  {
    href: '/usuarios',
    texto: 'Usuarios y Roles',
    permisoRequerido: PERMISOS.USUARIOS_VER,
  },
];

/**
 * Marco comun de la aplicacion: barra lateral adaptativa por RBAC,
 * cabecera y control de sesion.
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
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [avisoJornada, setAvisoJornada] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setUsuario(await api.get<Usuario>('/auth/yo'));
        setJornada(await api.get<Jornada | null>('/jornadas/actual'));
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

  async function alternarJornada() {
    setAvisoJornada(null);
    try {
      await api.post(jornada ? '/jornadas/salida' : '/jornadas/entrada');
      setJornada(await api.get<Jornada | null>('/jornadas/actual'));
    } catch (err) {
      setAvisoJornada(err instanceof ErrorApi ? err.message : 'No se pudo actualizar la jornada.');
    }
  }

  async function salir() {
    await api.post('/auth/logout');
    router.replace('/login');
  }

  if (!listo) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-400">
        Cargando…
      </main>
    );
  }

  // Filtrado RBAC: los trabajadores solo ven los módulos que tienen autorizados
  const seccionesVisibles = SECCIONES.filter((s) => {
    if (!s.permisoRequerido) return true;
    return usuario?.permisos?.includes(s.permisoRequerido) ?? false;
  });

  return (
    <ContextoSesion.Provider value={usuario}>
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-white/10 bg-slate-900/60 p-4 md:flex">
          <div className="mb-4 flex items-center gap-3 px-2 py-2">
            <Image
              src="/images/logo-timeflow.png"
              alt="TimeFlow"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
            />
            <div>
              <p className="font-bold leading-tight text-white">TimeFlow</p>
              <p className="text-[11px] text-slate-400">Jornada · Actividades</p>
            </div>
          </div>

          {seccionesVisibles.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`rounded-xl px-3 py-2.5 text-sm transition ${
                activo === s.href
                  ? 'bg-sky-500/15 font-semibold text-sky-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {s.texto}
            </Link>
          ))}

          <div className="mt-auto border-t border-white/10 pt-3">
            <p className="mb-2 px-3 text-xs font-medium text-slate-300">
              {usuario?.nombreCompleto}
            </p>
            <button
              onClick={salir}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-slate-900/60 px-6 py-4">
            <div className="min-w-0">
              <h1 className="truncate font-bold text-white">{titulo}</h1>
              {subtitulo && <p className="text-xs text-slate-400">{subtitulo}</p>}
            </div>
            <div className="ml-auto flex items-center gap-3">
              {avisoJornada && (
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
                  {avisoJornada}
                </span>
              )}
              <button
                onClick={alternarJornada}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  jornada
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${jornada ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`}
                />
                {jornada ? 'En jornada · marcar salida' : 'Marcar entrada'}
              </button>
              {acciones}
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-300"
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
