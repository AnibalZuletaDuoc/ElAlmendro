/**
 * Contratos y lógica de control de acceso basado en roles (RBAC).
 *
 * Compartido entre backend y frontend para garantizar una única fuente de verdad
 * sobre las autorizaciones del sistema.
 */

export type Rol = 'ADMINISTRADOR' | 'SUPERVISOR' | 'TRABAJADOR';

export const PERMISOS = {
  // Módulo Jornada / Presencia
  JORNADA_REGISTRAR: 'jornada:registrar',

  // Módulo Sesiones / Cronómetro
  SESION_CRONOMETRAR: 'sesion:cronometrar',

  // Módulo Actividades
  ACTIVIDADES_VER_PROPIAS: 'actividades:ver_propias',
  ACTIVIDADES_VER_TODAS: 'actividades:ver_todas',
  ACTIVIDADES_GESTIONAR: 'actividades:gestionar',

  // Módulo Calendario
  CALENDARIO_VER_PROPIO: 'calendario:ver_propio',
  CALENDARIO_VER_EQUIPO: 'calendario:ver_equipo',

  // Módulo Reportes y Dashboard
  REPORTES_VER_EQUIPO: 'reportes:ver_equipo',
  DASHBOARD_VER_RESUMEN: 'dashboard:ver_resumen',

  // Módulo Nodos
  NODOS_VER_MAPA: 'nodos:ver_mapa',

  // Módulo Usuarios (RBAC)
  USUARIOS_VER: 'usuarios:ver',
  USUARIOS_GESTIONAR: 'usuarios:gestionar',
} as const;

export type PermisoCodigo = (typeof PERMISOS)[keyof typeof PERMISOS];

/** Matriz de asignación de permisos según el rol del usuario. */
export const ROLES_PERMISOS: Record<Rol, readonly PermisoCodigo[]> = {
  ADMINISTRADOR: [
    PERMISOS.JORNADA_REGISTRAR,
    PERMISOS.SESION_CRONOMETRAR,
    PERMISOS.ACTIVIDADES_VER_PROPIAS,
    PERMISOS.ACTIVIDADES_VER_TODAS,
    PERMISOS.ACTIVIDADES_GESTIONAR,
    PERMISOS.CALENDARIO_VER_PROPIO,
    PERMISOS.CALENDARIO_VER_EQUIPO,
    PERMISOS.REPORTES_VER_EQUIPO,
    PERMISOS.DASHBOARD_VER_RESUMEN,
    PERMISOS.NODOS_VER_MAPA,
    PERMISOS.USUARIOS_VER,
    PERMISOS.USUARIOS_GESTIONAR,
  ],
  SUPERVISOR: [
    PERMISOS.JORNADA_REGISTRAR,
    PERMISOS.SESION_CRONOMETRAR,
    PERMISOS.ACTIVIDADES_VER_PROPIAS,
    PERMISOS.ACTIVIDADES_VER_TODAS,
    PERMISOS.CALENDARIO_VER_PROPIO,
    PERMISOS.CALENDARIO_VER_EQUIPO,
    PERMISOS.REPORTES_VER_EQUIPO,
    PERMISOS.DASHBOARD_VER_RESUMEN,
    PERMISOS.NODOS_VER_MAPA,
    PERMISOS.USUARIOS_VER,
    PERMISOS.USUARIOS_GESTIONAR,
  ],
  TRABAJADOR: [
    PERMISOS.JORNADA_REGISTRAR,
    PERMISOS.SESION_CRONOMETRAR,
    PERMISOS.ACTIVIDADES_VER_PROPIAS,
    PERMISOS.CALENDARIO_VER_PROPIO,
    PERMISOS.NODOS_VER_MAPA,
  ],
};

export interface RolDetalle {
  codigo: Rol;
  nombre: string;
  descripcion: string;
  permisos: readonly PermisoCodigo[];
}

export const ROLES_CATALOGO: readonly RolDetalle[] = [
  {
    codigo: 'ADMINISTRADOR',
    nombre: 'Administrador',
    descripcion: 'Gestión total de usuarios y roles, configuración del sistema, reportes generales y acceso completo a todos los módulos.',
    permisos: ROLES_PERMISOS.ADMINISTRADOR,
  },
  {
    codigo: 'SUPERVISOR',
    nombre: 'Supervisor',
    descripcion: 'Supervisión de operaciones, revisión de avances, reportes operativos y gestión de trabajadores a su cargo (sin acceso a administradores ni configuración crítica).',
    permisos: ROLES_PERMISOS.SUPERVISOR,
  },
  {
    codigo: 'TRABAJADOR',
    nombre: 'Trabajador',
    descripcion: 'Acceso a módulos operativos: registro de jornada, avance de actividades asignadas y calendario personal. Sin permisos de modificación de usuarios ni configuración.',
    permisos: ROLES_PERMISOS.TRABAJADOR,
  },
];

/** Devuelve la lista de permisos asociados a un rol. */
export function obtenerPermisosDeRol(rol?: string | null): PermisoCodigo[] {
  if (!rol || !(rol in ROLES_PERMISOS)) return [];
  return [...ROLES_PERMISOS[rol as Rol]];
}

