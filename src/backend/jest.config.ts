import type { Config } from 'jest';

/**
 * Configuracion de pruebas unitarias de la API.
 *
 * Los imports del backend son relativos y el tsconfig no declara "paths",
 * por lo que no hace falta moduleNameMapper.
 */
const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  // Las pruebas viven FUERA de src/ para que el build de produccion
  // (tsconfig incluye solo src/**/*) nunca las arrastre a dist/.
  // src/ se incluye SOLO para que la cobertura vea los modulos aun sin
  // pruebas y el porcentaje no mienta; como testRegex exige *.spec.ts y ahi
  // ya no queda ninguno, de src/ no se ejecuta nada.
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\.spec\.ts$',

  // isolatedModules rompe emitDecoratorMetadata: no activarlo.
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },

  setupFilesAfterEnv: ['<rootDir>/test/configuracion.ts'],

  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10_000,

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/dto/**',
    '!src/infra/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
};

export default config;
