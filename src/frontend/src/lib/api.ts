/**
 * Cliente de la API.
 *
 * Todas las llamadas viajan con la cookie httpOnly emitida por la API en el
 * inicio de sesion: por eso `credentials: include`. El token nunca pasa por
 * JavaScript, de modo que un script inyectado no puede leerlo.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ErrorApi extends Error {
  constructor(public readonly estado: number, mensaje: string) {
    super(mensaje);
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${ruta}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });

  if (!res.ok) {
    let mensaje = 'No se pudo completar la operacion.';
    try {
      const cuerpo = await res.json();
      mensaje = Array.isArray(cuerpo.message)
        ? cuerpo.message[0]
        : (cuerpo.message ?? mensaje);
    } catch {
      /* la respuesta no traia cuerpo JSON */
    }
    throw new ErrorApi(res.status, mensaje);
  }

  // Nest responde con cuerpo vacio cuando el handler devuelve null, como
  // ocurre al no haber jornada abierta ni sesion activa. Ese caso es normal y
  // no debe tratarse como una respuesta invalida.
  const texto = await res.text();
  return (texto ? JSON.parse(texto) : null) as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>(ruta),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    pedir<T>(ruta, {
      method: 'POST',
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    }),
};

// ------------------------------- tipos -------------------------------

export interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: 'ADMINISTRADOR' | 'TRABAJADOR';
}

export interface Subtarea {
  id: string;
  titulo: string;
  completada: boolean;
}

export interface Actividad {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  minutosEstimados: number | null;
  segundosTrabajados: number;
  proyecto: { nombre: string };
  responsable: { nombreCompleto: string };
  subtareas: Subtarea[];
}

export interface Jornada {
  id: string;
  inicioEn: string;
  terminoEn: string | null;
  estado: string;
}

export interface Sesion {
  id: string;
  estado: 'ACTIVA' | 'PAUSADA';
  inicioEn: string;
  segundosAcumulados: number;
  actividad: { id: string; titulo: string };
}
