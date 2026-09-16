'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cache en memoria de respuestas de la API, por clave. Vive mientras dure la
 * pestana: al volver a una pantalla ya visitada, se pinta al instante con lo
 * ultimo que se vio y la peticion solo revalida en segundo plano.
 */
const memoria = new Map<string, unknown>();

export function invalidarCacheDatos(prefijo?: string) {
  if (!prefijo) {
    memoria.clear();
    return;
  }
  for (const clave of memoria.keys()) {
    if (clave.startsWith(prefijo)) memoria.delete(clave);
  }
}

interface Resultado<T> {
  datos: T | null;
  /** true solo cuando no hay nada que mostrar todavia (primera carga). */
  cargando: boolean;
  /** true mientras se revalida en segundo plano teniendo datos en pantalla. */
  revalidando: boolean;
  error: unknown;
  recargar: () => Promise<void>;
}

/**
 * Patron "stale-while-revalidate": devuelve la copia en cache de inmediato y
 * la reemplaza cuando responde la API. `cargar` debe ser estable (useCallback)
 * o cambiar solo cuando cambie la clave.
 */
export function useDatosCache<T>(clave: string, cargar: () => Promise<T>): Resultado<T> {
  const enCache = memoria.get(clave) as T | undefined;
  const [datos, setDatos] = useState<T | null>(enCache ?? null);
  const [cargando, setCargando] = useState(enCache === undefined);
  const [revalidando, setRevalidando] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const claveRef = useRef(clave);

  const recargar = useCallback(async () => {
    const claveActual = clave;
    const teniaDatos = memoria.has(claveActual);
    setRevalidando(true);
    if (!teniaDatos) setCargando(true);
    try {
      const resultado = await cargar();
      memoria.set(claveActual, resultado);
      if (claveRef.current === claveActual) {
        setDatos(resultado);
        setError(null);
      }
    } catch (err) {
      if (claveRef.current === claveActual) setError(err);
    } finally {
      if (claveRef.current === claveActual) {
        setCargando(false);
        setRevalidando(false);
      }
    }
  }, [clave, cargar]);

  useEffect(() => {
    claveRef.current = clave;
    const previo = memoria.get(clave) as T | undefined;
    setDatos(previo ?? null);
    setCargando(previo === undefined);
    setError(null);
    recargar();
  }, [clave, recargar]);

  return { datos, cargando, revalidando, error, recargar };
}
