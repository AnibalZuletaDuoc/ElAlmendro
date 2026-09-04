/**
 * Toda marca llega desde la API en UTC. La conversion a la zona local ocurre
 * aqui y solo aqui: es la unica capa que puede hacerlo.
 */
const ZONA = 'America/Santiago';

/** Segundos a HH:MM:SS, formato del cronometro. */
export function cronometro(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** Segundos a una lectura breve: "45 s", "12 min", "2 h 15 min". */
export function duracion(segundos: number): string {
  if (segundos <= 0) return 'sin registro';
  if (segundos < 60) return `${segundos} s`;

  const totalMin = Math.floor(segundos / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ESTADOS: Record<string, { texto: string; clase: string; punto: string }> = {
  PENDIENTE:   { texto: 'Por hacer',   clase: 'text-sky-700 bg-sky-50 border-sky-200',       punto: 'bg-sky-500' },
  EN_PROGRESO: { texto: 'En progreso', clase: 'text-amber-700 bg-amber-50 border-amber-200', punto: 'bg-amber-500' },
  BLOQUEADA:   { texto: 'Bloqueada',   clase: 'text-rose-700 bg-rose-50 border-rose-200',    punto: 'bg-rose-500' },
  INCONCLUSA:  { texto: 'Inconclusa',  clase: 'text-orange-700 bg-orange-50 border-orange-200', punto: 'bg-orange-500' },
  COMPLETADA:  { texto: 'Completada',  clase: 'text-emerald-700 bg-emerald-50 border-emerald-200', punto: 'bg-emerald-500' },
  CANCELADA:   { texto: 'Cancelada',   clase: 'text-slate-600 bg-slate-100 border-slate-200', punto: 'bg-slate-400' },
};

export const PRIORIDADES: Record<string, string> = {
  BAJA: 'text-slate-600 bg-slate-100',
  MEDIA: 'text-sky-700 bg-sky-100',
  ALTA: 'text-orange-700 bg-orange-100',
  CRITICA: 'text-rose-700 bg-rose-100',
};

/** Iniciales para el avatar. */
export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
