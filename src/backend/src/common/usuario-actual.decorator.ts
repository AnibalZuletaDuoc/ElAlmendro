import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Datos del usuario autenticado, puestos en la peticion por JwtAuthGuard. */
export interface UsuarioActual {
  id: string;
  email: string;
  rol: 'ADMINISTRADOR' | 'TRABAJADOR';
  nombreCompleto: string;
}

export const Usuario = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): UsuarioActual =>
    ctx.switchToHttp().getRequest().usuario,
);
