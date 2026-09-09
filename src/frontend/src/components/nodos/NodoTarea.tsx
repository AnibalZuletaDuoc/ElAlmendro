'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: '#38bdf8',
  EN_PROGRESO: '#f59e0b',
  BLOQUEADA: '#f43f5e',
  INCONCLUSA: '#f97316',
  COMPLETADA: '#10b981',
  CANCELADA: '#64748b',
};

export interface DatosNodoTarea {
  titulo: string;
  estado: string;
  color: string;
  tieneHijos: boolean;
  expandido: boolean;
  onAlternar: () => void;
  onAgregarHija: (titulo: string) => void;
  [clave: string]: unknown;
}

/**
 * Burbuja de tarea del mapa mental horizontal. El color identifica el nivel
 * de profundidad; el punto interior indica el estado real de la tarea. El
 * boton circular del borde despliega o repliega sus hijas, igual que en el
 * mapa mental de referencia — parte siempre colapsado.
 */
export default function NodoTarea({ data }: NodeProps) {
  const d = data as DatosNodoTarea;
  const [agregando, setAgregando] = useState(false);
  const [texto, setTexto] = useState('');

  function confirmar() {
    const limpio = texto.trim();
    if (limpio) d.onAgregarHija(limpio);
    setTexto('');
    setAgregando(false);
  }

  return (
    <div className="group relative">
      <div
        className="flex max-w-[210px] items-center gap-2 rounded-lg border px-3.5 py-2 shadow-lg backdrop-blur-sm"
        style={{ borderColor: `${d.color}80`, background: `${d.color}22` }}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !bg-slate-950"
          style={{ borderColor: d.color }}
        />
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: COLOR_ESTADO[d.estado] ?? '#94a3b8' }}
        />
        <span className="truncate text-xs font-semibold text-white">{d.titulo}</span>
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-2 !bg-slate-950"
          style={{ borderColor: d.color }}
        />

        {d.tieneHijos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              d.onAlternar();
            }}
            title={d.expandido ? 'Contraer' : 'Desplegar'}
            className="absolute -right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-slate-800 text-white ring-1 ring-white/25 hover:bg-slate-700"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-3 w-3 transition-transform ${d.expandido ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
            </svg>
          </button>
        )}
      </div>

      {agregando ? (
        <input
          autoFocus
          value={texto}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmar();
            if (e.key === 'Escape') {
              setTexto('');
              setAgregando(false);
            }
          }}
          onBlur={confirmar}
          placeholder="Nueva tarea…"
          className="absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-lg border border-white/20 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-xl outline-none"
        />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAgregando(true);
          }}
          title="Agregar tarea hija"
          className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 place-items-center rounded-full bg-slate-800 text-[11px] leading-none text-white ring-1 ring-white/20 hover:bg-slate-700 group-hover:grid"
        >
          +
        </button>
      )}
    </div>
  );
}
