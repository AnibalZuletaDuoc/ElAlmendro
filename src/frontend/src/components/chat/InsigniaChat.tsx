'use client';

import { useChat } from '@/lib/chat';

/**
 * Insignia del enlace "Chat del equipo" en el menu: cuantos mensajes privados
 * esperan lectura y cuanta gente esta en linea ahora mismo.
 */
export default function InsigniaChat() {
  const { noLeidos, enLinea, conectado } = useChat();

  return (
    <span className="flex items-center gap-1.5">
      {noLeidos > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
          {noLeidos > 99 ? '99+' : noLeidos}
        </span>
      )}
      <span
        className="flex items-center gap-1 text-[10px] text-slate-500"
        title={conectado ? `${enLinea.size} en linea` : 'Chat desconectado'}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            conectado ? 'bg-emerald-400' : 'bg-slate-600'
          }`}
        />
        {conectado ? enLinea.size : '—'}
      </span>
    </span>
  );
}
