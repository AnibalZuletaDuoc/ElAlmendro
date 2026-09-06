'use client';

import { createContext, useContext } from 'react';
import { PermisoCodigo, Rol } from './rbac';
import { Usuario } from '@/lib/api';

/**
 * Usuario de la sesion, disponible para las pantallas.
 *
 * Se comparte por contexto para no repetir la peticion en cada pagina.
 */
export const ContextoSesion = createContext<Usuario | null>(null);

export function useSesion(): Usuario | null {
  return useContext(ContextoSesion);
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
