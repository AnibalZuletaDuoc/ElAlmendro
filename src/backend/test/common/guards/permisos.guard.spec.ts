import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisosGuard } from '../../../src/common/guards/permisos.guard';
import { PERMISOS, PermisoCodigo } from '../../../src/common/rbac';
import { contextoFalso } from '../../utilidades/contexto';

describe('PermisosGuard', () => {
  let reflector: Reflector;
  let guard: PermisosGuard;

  /** Fija lo que devolvera el decorador @ExigirPermisos para este caso. */
  const exigir = (permisos: PermisoCodigo[] | undefined) =>
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(permisos as PermisoCodigo[]);

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermisosGuard(reflector);
  });

  it('deja pasar cuando el endpoint no exige permisos', () => {
    exigir(undefined);

    expect(guard.canActivate(contextoFalso({ permisos: [] }))).toBe(true);
  });

  it('deja pasar cuando la lista de permisos exigidos esta vacia', () => {
    exigir([]);

    expect(guard.canActivate(contextoFalso(undefined))).toBe(true);
  });

  it('rechaza cuando no hay usuario en la peticion', () => {
    exigir([PERMISOS.USUARIOS_VER]);

    expect(() => guard.canActivate(contextoFalso(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('rechaza cuando el usuario no trae permisos', () => {
    exigir([PERMISOS.USUARIOS_VER]);

    expect(() => guard.canActivate(contextoFalso({ id: 'u1' }))).toThrow(
      ForbiddenException,
    );
  });

  it('deja pasar cuando el usuario tiene el permiso exigido', () => {
    exigir([PERMISOS.REPORTES_VER_EQUIPO]);

    const ctx = contextoFalso({ permisos: [PERMISOS.REPORTES_VER_EQUIPO] });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('exige TODOS los permisos: falta uno de dos y rechaza nombrandolos', () => {
    exigir([PERMISOS.USUARIOS_VER, PERMISOS.USUARIOS_GESTIONAR]);

    const ctx = contextoFalso({ permisos: [PERMISOS.USUARIOS_VER] });

    expect(() => guard.canActivate(ctx)).toThrow(
      /usuarios:ver, usuarios:gestionar/,
    );
  });
});
