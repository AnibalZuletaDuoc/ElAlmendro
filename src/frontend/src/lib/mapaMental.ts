import { NodoActividad } from './tipos';

/** Un color por nivel de profundidad (no por rama): asi se lee de un vistazo
 * en que "columna" del arbol esta cada tarea, igual que en el mapa mental de
 * referencia (NotebookLM). */
export const PALETA_PROFUNDIDAD = [
  '#38bdf8', // nivel 1 — sky
  '#34d399', // nivel 2 — emerald
  '#f97316', // nivel 3 — orange
  '#a78bfa', // nivel 4 — violet
  '#f472b6', // nivel 5 — pink
  '#facc15', // nivel 6 — amber
];

/**
 * Sentido en que crece el arbol: `horizontal` (de izquierda a derecha, cada
 * nivel una columna mas a la derecha) o `vertical` (de arriba a abajo, cada
 * nivel una fila mas abajo, tipo organigrama).
 */
export type Orientacion = 'horizontal' | 'vertical';

/** Distancia entre niveles y entre hermanos, en cada orientacion. */
const ESPACIO: Record<Orientacion, { nivel: number; hermano: number }> = {
  horizontal: { nivel: 250, hermano: 64 },
  // Las burbujas son anchas (hasta 210 px) y bajas: de arriba a abajo los
  // hermanos necesitan mas separacion lateral y los niveles menos.
  vertical: { nivel: 120, hermano: 236 },
};

export interface NodoMapa {
  id: string;
  x: number;
  y: number;
  color: string;
  profundidad: number;
  tieneHijos: boolean;
}

export interface ArbolCalculado {
  posiciones: Map<string, NodoMapa>;
  posicionRaiz: { x: number; y: number };
  raicesProyecto: NodoActividad[];
}

/**
 * Layout de arbol colapsable tipo mapa mental. Primero se resuelve la forma
 * abstracta (nivel de profundidad y "carril" de cada tarea, centrando cada
 * padre sobre sus hijas visibles) y al final se traduce a coordenadas segun
 * la orientacion. Solo se calcula posicion para las tareas visibles: una
 * rama colapsada no ocupa espacio ni aparece en el resultado.
 */
export function calcularArbol(
  actividades: NodoActividad[],
  expandidoRaiz: boolean,
  expandido: ReadonlySet<string>,
  orientacion: Orientacion,
): ArbolCalculado {
  const hijosPorPadre = new Map<string, NodoActividad[]>();
  const raicesProyecto: NodoActividad[] = [];
  for (const a of actividades) {
    if (a.actividadPadreId) {
      if (!hijosPorPadre.has(a.actividadPadreId)) hijosPorPadre.set(a.actividadPadreId, []);
      hijosPorPadre.get(a.actividadPadreId)!.push(a);
    } else {
      raicesProyecto.push(a);
    }
  }

  const espacio = ESPACIO[orientacion];
  const coordenadas = (profundidad: number, carril: number) =>
    orientacion === 'horizontal'
      ? { x: profundidad * espacio.nivel, y: carril * espacio.hermano }
      : { x: carril * espacio.hermano, y: profundidad * espacio.nivel };

  const posiciones = new Map<string, NodoMapa>();
  let contadorCarril = 0;

  function ubicar(a: NodoActividad, profundidad: number): number {
    const hijos = hijosPorPadre.get(a.id) ?? [];
    const hijosVisibles = expandido.has(a.id) ? hijos : [];

    let carril: number;
    if (hijosVisibles.length === 0) {
      carril = contadorCarril;
      contadorCarril += 1;
    } else {
      const carriles = hijosVisibles.map((h) => ubicar(h, profundidad + 1));
      carril = (Math.min(...carriles) + Math.max(...carriles)) / 2;
    }

    posiciones.set(a.id, {
      id: a.id,
      ...coordenadas(profundidad, carril),
      color: PALETA_PROFUNDIDAD[(profundidad - 1) % PALETA_PROFUNDIDAD.length],
      profundidad,
      tieneHijos: hijos.length > 0,
    });
    return carril;
  }

  const raicesVisibles = expandidoRaiz ? raicesProyecto : [];
  let carrilRaiz: number;
  if (raicesVisibles.length === 0) {
    carrilRaiz = contadorCarril;
    contadorCarril += 1;
  } else {
    const carriles = raicesVisibles.map((h) => ubicar(h, 1));
    carrilRaiz = (Math.min(...carriles) + Math.max(...carriles)) / 2;
  }

  return { posiciones, posicionRaiz: coordenadas(0, carrilRaiz), raicesProyecto };
}
