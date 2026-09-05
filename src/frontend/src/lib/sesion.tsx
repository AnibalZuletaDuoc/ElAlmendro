'use client';

import { createContext, useContext } from 'react';
import { Usuario } from '@/lib/api';

/**
 * Usuario de la sesion, disponible para las pantallas.
 *
 * `Marco` ya consulta `/auth/yo` para pintar la barra lateral, pero lo guardaba
 * en su propio estado y ninguna pantalla podia leer el rol. El calendario si lo
 * necesita: solo el administrador ve el selector de trabajador. Se comparte por
 * contexto para no repetir la peticion en cada pagina.
 *
 * Ocultar el selector no es la medida de seguridad: el alcance real lo impone
 * la API, que descarta el trabajador pedido cuando quien consulta no es
 * administrador.
 */
export const ContextoSesion = createContext<Usuario | null>(null);

export function useSesion(): Usuario | null {
  return useContext(ContextoSesion);
}

export function esAdministrador(usuario: Usuario | null): boolean {
  return usuario?.rol === 'ADMINISTRADOR';
}
