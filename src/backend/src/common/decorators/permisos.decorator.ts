import { SetMetadata } from '@nestjs/common';
import { PermisoCodigo } from '../rbac';

export const CLAVE_PERMISOS = 'permisos';

/**
 * Decorador para restringir endpoints en base a permisos específicos (RBAC).
 *
 * Ejemplo:
 *   @ExigirPermisos(PERMISOS.USUARIOS_VER)
 *   @Get()
 *   listar() { ... }
 */
export const ExigirPermisos = (...permisos: PermisoCodigo[]) =>
  SetMetadata(CLAVE_PERMISOS, permisos);

