'use client';

import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface DatosNodoRaiz {
  nombre: string;
  tieneHijos: boolean;
  expandido: boolean;
  onAlternar: () => void;
  onAgregarHija: (titulo: string) => void;
  [clave: string]: unknown;
}

/**
 * Burbuja central del mapa mental: el proyecto del que cuelgan las tareas.
 * Parte siempre colapsada — hay que desplegarla para ver las tareas de
 * primer nivel, igual que cualquier otro nodo del arbol.
 */
export default function NodoRaiz({ data }: NodeProps) {
  const d = data as DatosNodoRaiz;
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
        className="flex max-w-[220px] items-center justify-center rounded-xl px-5 py-3.5 text-center shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #0369a1, #4338ca)',
          border: '1px solid rgba(56,189,248,0.6)',
          boxShadow: '0 6px 24px rgba(56,189,248,.35)',
        }}
      >
        <span className="text-sm font-bold leading-snug text-white">{d.nombre}</span>
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-sky-300 !bg-slate-950"
        />

        {d.tieneHijos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              d.onAlternar();
            }}
            title={d.expandido ? 'Contraer' : 'Desplegar'}
            className="absolute -right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-slate-800 text-white ring-1 ring-white/25 hover:bg-slate-700"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 transition-transform ${d.expandido ? 'rotate-90' : ''}`}
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
          className="absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-lg border border-white/20 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-xl outline-none"
        />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAgregando(true);
          }}
          title="Agregar tarea"
          className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 place-items-center rounded-full bg-slate-800 text-xs leading-none text-white ring-1 ring-white/20 hover:bg-slate-700 group-hover:grid"
        >
          +
        </button>
      )}
    </div>
  );
}
