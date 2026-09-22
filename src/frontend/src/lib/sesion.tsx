'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import { PermisoCodigo, Rol } from './rbac';
import { Usuario } from '@/lib/api';
import {
  leerCacheSesion,
  leerCacheSesionServidor,
  suscribirCacheSesion,
} from './cacheSesion';

/**
 * Usuario de la sesion, disponible para las pantallas.
 *
 * Se comparte por contexto para no repetir la peticion en cada pagina.
 */
export const ContextoSesion = createContext<Usuario | null>(null);

/**
 * El Provider lo monta Marco, pero casi todas las paginas llaman a useSesion
 * desde el componente que RENDERIZA a Marco (o sea, fuera del Provider), donde
 * el contexto es null. Por eso, si no hay contexto, se lee la misma cache de
 * sesion que alimenta a Marco: es la unica fuente de verdad y se actualiza
 * apenas /auth/yo responde.
 */
export function useSesion(): Usuario | null {
  const delContexto = useContext(ContextoSesion);
  const cache = useSyncExternalStore(
    suscribirCacheSesion,
    leerCacheSesion,
    leerCacheSesionServidor,
  );
  return delContexto ?? cache?.usuario ?? null;
}

export function useTienePermiso(permiso: PermisoCodigo): boolean {
  const usuario = useSesion();
  if (!usuario || !usuario.permisos) return false;
  return usuario.permisos.includes(permiso);
}

export function esAdministrador(usuario: Usuario | null): boolean {
  return usuario?.rol === 'ADMINISTRADOR';
}

export function esRol(usuario: Usuario | null, rol: Rol): boolean {
  return usuario?.rol === rol;
}
