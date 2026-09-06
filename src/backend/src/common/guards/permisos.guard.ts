import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisoCodigo } from '../rbac';
import { CLAVE_PERMISOS } from '../decorators/permisos.decorator';
import { UsuarioActual } from '../usuario-actual.decorator';

/**
 * Guard que evalúa si el usuario autenticado posee los permisos requeridos
 * por el decorador @ExigirPermisos.
 */
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const permisosRequeridos = this.reflector.getAllAndOverride<PermisoCodigo[]>(
      CLAVE_PERMISOS,
      [ctx.getHandler(), ctx.getClass()],
    );

    // Si el endpoint no exige permisos específicos, basta con la autenticación previa.
    if (!permisosRequeridos || permisosRequeridos.length === 0) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
    const usuario: UsuarioActual | undefined = req.usuario;

    if (!usuario || !usuario.permisos) {
      throw new ForbiddenException('No posees permisos para acceder a este recurso.');
    }

    const tienePermisos = permisosRequeridos.every((p) =>
      usuario.permisos.includes(p),
    );

    if (!tienePermisos) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere el permiso: ${permisosRequeridos.join(', ')}`,
      );
    }

    return true;
  }
}

