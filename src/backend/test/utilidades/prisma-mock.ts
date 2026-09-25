import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../../src/infra/prisma/prisma.service';

export type PrismaMock = DeepMockProxy<PrismaService>;

/**
 * Prisma simulado para pruebas unitarias.
 *
 * mockDeep genera cualquier ruta anidada al vuelo (prisma.usuario.findUnique,
 * prisma.tramoSesion.create, ...) conservando los tipos de @prisma/client.
 *
 * Lo unico que no resuelve solo es $transaction, que los servicios de
 * sesiones y usuarios usan en toda escritura: aqui se ejecuta el callback
 * pasandole el propio mock como "tx", de modo que las escrituras dentro de
 * la transaccion se pueden auditar con prisma.<modelo>.create.mock.calls.
 */
export function crearPrismaMock(): PrismaMock {
  const prisma = mockDeep<PrismaService>();

  (prisma.$transaction as unknown as jest.Mock).mockImplementation(
    async (arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: PrismaMock) => unknown)(prisma)
        : Promise.all(arg as unknown[]),
  );

  return prisma;
}
