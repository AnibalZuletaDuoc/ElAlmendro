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

const ESPACIO_X = 250;
const ESPACIO_Y = 64;

export interface NodoMapa {
  id: string;
  x: number;
  y: number;
  color: string;
  profundidad: number;
  tieneHijos: boolean;
}

export interface ArbolHorizontal {
  posiciones: Map<string, NodoMapa>;
  yRaiz: number;
  raicesProyecto: NodoActividad[];
}

/**
 * Layout de arbol horizontal (izquierda a derecha), tipo mapa mental
 * colapsable: cada tarea avanza una columna hacia la derecha por nivel, y solo
 * se calcula posicion para las tareas visibles — una rama colapsada no ocupa
 * espacio ni aparece en el resultado.
 */
export function calcularArbolHorizontal(
  actividades: NodoActividad[],
  expandidoRaiz: boolean,
  expandido: ReadonlySet<string>,
): ArbolHorizontal {
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

  const posiciones = new Map<string, NodoMapa>();
  let contadorFila = 0;

  function ubicar(a: NodoActividad, profundidad: number): number {
    const hijos = hijosPorPadre.get(a.id) ?? [];
    const hijosVisibles = expandido.has(a.id) ? hijos : [];

    let fila: number;
    if (hijosVisibles.length === 0) {
      fila = contadorFila;
      contadorFila += 1;
    } else {
      const filas = hijosVisibles.map((h) => ubicar(h, profundidad + 1));
      fila = (Math.min(...filas) + Math.max(...filas)) / 2;
    }

    posiciones.set(a.id, {
      id: a.id,
      x: profundidad * ESPACIO_X,
      y: fila * ESPACIO_Y,
      color: PALETA_PROFUNDIDAD[(profundidad - 1) % PALETA_PROFUNDIDAD.length],
      profundidad,
      tieneHijos: hijos.length > 0,
    });
    return fila;
  }

  const raicesVisibles = expandidoRaiz ? raicesProyecto : [];
  let filaRaiz: number;
  if (raicesVisibles.length === 0) {
    filaRaiz = contadorFila;
    contadorFila += 1;
  } else {
    const filas = raicesVisibles.map((h) => ubicar(h, 1));
    filaRaiz = (Math.min(...filas) + Math.max(...filas)) / 2;
  }

  return { posiciones, yRaiz: filaRaiz * ESPACIO_Y, raicesProyecto };
}
