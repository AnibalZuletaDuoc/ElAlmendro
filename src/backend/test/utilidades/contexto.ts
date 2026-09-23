import { ExecutionContext } from '@nestjs/common';

/** ExecutionContext minimo para probar guards sin levantar HTTP. */
export function contextoFalso(usuario?: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ usuario }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}
