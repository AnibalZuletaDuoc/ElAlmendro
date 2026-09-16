import { Position } from '@xyflow/react';
import type { Orientacion } from '@/lib/mapaMental';

/**
 * Donde van los conectores y el boton de desplegar de una burbuja segun el
 * sentido del arbol. En horizontal las hijas cuelgan del borde derecho; en
 * vertical, del borde inferior.
 */
export function disposicionNodo(orientacion: Orientacion) {
  const horizontal = orientacion === 'horizontal';
  return {
    entrada: horizontal ? Position.Left : Position.Top,
    salida: horizontal ? Position.Right : Position.Bottom,
    /** Posicion absoluta del boton circular de desplegar/contraer. */
    claseBoton: horizontal
      ? '-right-3 top-1/2 -translate-y-1/2'
      : '-bottom-3 left-1/2 -translate-x-1/2',
    /** Chevron apuntando hacia donde se abren las hijas; girado al expandir. */
    trazoFlecha: horizontal ? 'm9 6 6 6-6 6' : 'm6 9 6 6 6-6',
    claseFlechaExpandida: horizontal ? 'rotate-90' : 'rotate-180',
  };
}
