'use client';

import { useEffect, useState } from 'react';

/**
 * Aviso de version nueva.
 *
 * Cada despliegue deja el commit en dos lugares: incrustado en este bundle
 * (NEXT_PUBLIC_VERSION, fijo desde que se compilo) y en /version.json, que
 * siempre refleja lo que hay ahora en el servidor. Si dejan de coincidir, esta
 * pestana quedo vieja.
 *
 * No recarga sola a proposito: podria cortar un cronometro en marcha o borrar
 * un mensaje a medio escribir. Avisa y deja que la persona elija el momento.
 */
const VERSION_COMPILADA = process.env.NEXT_PUBLIC_VERSION ?? '';
const CADA_MS = 60_000;

export default function AvisoVersion() {
  const [hayVersionNueva, setHayVersionNueva] = useState(false);

  useEffect(() => {
    if (!VERSION_COMPILADA) return; // desarrollo: no hay nada que comparar
    let vigente = true;

    async function revisar() {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version?: string };
        if (vigente && version && version !== VERSION_COMPILADA) {
          setHayVersionNueva(true);
        }
      } catch {
        /* sin red o servidor reiniciandose: se reintenta en la proxima vuelta */
      }
    }

    void revisar();
    const id = setInterval(revisar, CADA_MS);
    document.addEventListener('visibilitychange', revisar);
    return () => {
      vigente = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', revisar);
    };
  }, []);

  if (!hayVersionNueva) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 border-t border-sky-400/30 bg-sky-500/15 px-4 py-2.5 text-sm text-sky-100 backdrop-blur"
    >
      <span>Hay una version nueva de TimeFlow.</span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-400"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
