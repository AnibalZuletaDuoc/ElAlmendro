/**
 * Nest carga reflect-metadata en main.ts, que Jest nunca ejecuta.
 * Sin esto los decoradores de los providers fallan al construir el modulo.
 */
import 'reflect-metadata';
