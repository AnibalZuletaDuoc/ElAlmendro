import type { Jornada, Usuario } from '@/lib/api';

const CLAVE = 'tf_sesion';

/**
 * Copia en memoria del usuario y su jornada, compartida por todas las
 * pantallas. Cada pagina monta su propio Marco: sin esta cache, cada cambio
 * de ruta volvia a pedir /auth/yo y /jornadas/actual y mostraba "Cargando…"
 * hasta tener ambas respuestas. Con ella la pantalla se pinta de inmediato y
 * las peticiones solo revalidan en segundo plano.
 *
 * Se respalda en sessionStorage para sobrevivir a un F5. No guarda nada
 * sensible: el token sigue en la cookie httpOnly.
 *
 * Se expone como "external store" (suscribir + leer) para consumirla con
 * useSyncExternalStore: el servidor no tiene sessionStorage, asi que el HTML
 * inicial se hidrata con `null` y React pasa al valor real antes de pintar,
 * sin discrepancia de hidratacion.
 */
export interface CacheSesion {
  usuario: Usuario | null;
  jornada: Jornada | null;
}

let memoria: CacheSesion | null = null;
let leida = false;
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((fn) => fn());
}

export function leerCacheSesion(): CacheSesion | null {
  if (leida) return memoria;
  leida = true;
  if (typeof window === 'undefined') return null;
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    memoria = crudo ? (JSON.parse(crudo) as CacheSesion) : null;
  } catch {
    memoria = null;
  }
  return memoria;
}

/** En el servidor no hay sesion en cache: siempre `null`. */
export function leerCacheSesionServidor(): CacheSesion | null {
  return null;
}

export function suscribirCacheSesion(fn: () => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export function guardarCacheSesion(datos: CacheSesion) {
  memoria = datos;
  leida = true;
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    /* almacenamiento bloqueado: la copia en memoria basta */
  }
  avisar();
}

export function limpiarCacheSesion() {
  memoria = null;
  leida = true;
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {
    /* nada que limpiar */
  }
  avisar();
}
