'use client';

import { useId } from 'react';

/** Contorno del saco: lo comparten el relleno recortado y el trazo exterior. */
const CUERPO =
  'M46 47 C28 55 14 74 14 92 C14 112 32 122 60 122 C88 122 106 112 106 92 C106 74 92 55 74 47 Z';

/**
 * Bolsa de oro: la representacion visual de una tarea.
 *
 * El oro sube desde el fondo segun `llenado` (0 a 1), que es la proporcion de
 * monedas —microtareas— ya marcadas. Los pliegues de la tela y el cuello atado
 * se dibujan siempre por encima del oro: aunque la bolsa este llena se sigue
 * leyendo como un saco y no como una mancha dorada.
 */
export default function BolsaOro({
  llenado,
  tamano = 96,
  guardada = false,
  animada = true,
  className = '',
}: {
  /** 0 a 1. */
  llenado: number;
  tamano?: number;
  /** Ya guardada en el cofre: monedas asomando y destello. */
  guardada?: boolean;
  animada?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const nivel = Math.max(0, Math.min(1, llenado));
  const llena = nivel >= 1 || guardada;

  // Interior util del saco: de y=50 (bajo el cuello) a y=122 (fondo).
  const TOPE = 50;
  const FONDO = 122;
  const alturaOro = (FONDO - TOPE) * nivel;
  const yOro = FONDO - alturaOro;
  const transicion = animada ? 'y 600ms ease-out, height 600ms ease-out' : undefined;

  return (
    <svg
      viewBox="0 0 120 130"
      width={tamano}
      height={(tamano * 130) / 120}
      className={className}
      role="img"
      aria-label={`Bolsa ${Math.round(nivel * 100)}% llena`}
    >
      <defs>
        <clipPath id={`cuerpo-${id}`}>
          <path d={CUERPO} />
        </clipPath>
        <linearGradient id={`oro-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbd97a" />
          <stop offset="55%" stopColor="#efb43c" />
          <stop offset="100%" stopColor="#c8891c" />
        </linearGradient>
        <linearGradient id={`tela-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#9c7040" />
          <stop offset="100%" stopColor="#5d3f20" />
        </linearGradient>
        <radialGradient id={`destello-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {llena && <circle cx="60" cy="86" r="54" fill={`url(#destello-${id})`} />}

      {/* Saco */}
      <path d={CUERPO} fill={`url(#tela-${id})`} stroke="#3d2712" strokeWidth="2.5" />

      {/* Oro acumulado dentro del saco */}
      <g clipPath={`url(#cuerpo-${id})`}>
        <rect
          x="0"
          y={yOro}
          width="120"
          height={alturaOro + 4}
          fill={`url(#oro-${id})`}
          style={{ transition: transicion }}
        />
        {nivel > 0.12 && (
          <rect
            x="0"
            y={yOro}
            width="120"
            height="2"
            fill="#fde9b0"
            opacity="0.7"
            style={{ transition: animada ? 'y 600ms ease-out' : undefined }}
          />
        )}
        {/* Pliegues de la tela: van sobre el oro para que el saco siga
            leyendose como saco incluso lleno del todo. */}
        <g stroke="#3d2712" strokeOpacity="0.28" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M38 52 C31 72 30 96 36 118" />
          <path d="M82 52 C89 72 90 96 84 118" />
          <path d="M60 50 C58 74 59 98 60 120" strokeOpacity="0.16" />
        </g>
      </g>

      {/* Cuello fruncido: la tela recogida sobre la atadura */}
      <path
        d="M45 40 C43 30 47 22 52 20 C55 26 58 22 60 18 C62 22 65 26 68 20 C73 22 77 30 75 40 Z"
        fill={`url(#tela-${id})`}
        stroke="#3d2712"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Atadura y sus cabos */}
      <rect x="38" y="38" width="44" height="12" rx="5" fill="#b9873f" stroke="#3d2712" strokeWidth="2.4" />
      <path
        d="M38 44 C30 45 26 50 24 55 M82 44 C90 45 94 50 96 55"
        fill="none"
        stroke="#8a6136"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="44" r="2.8" fill="#f7cf62" stroke="#3d2712" strokeWidth="1.2" />

      {/* Monedas derramandose por la boca del saco lleno */}
      {llena && (
        <g>
          <circle cx="47" cy="24" r="5.5" fill="#f7cf62" stroke="#a9761a" strokeWidth="1.3" />
          <circle cx="73" cy="26" r="5" fill="#eab63f" stroke="#a9761a" strokeWidth="1.3" />
          <circle cx="60" cy="14" r="6" fill="#fde9b0" stroke="#a9761a" strokeWidth="1.3" />
        </g>
      )}

      {/* Brillo sobre la tela */}
      <path
        d="M30 68 C25 80 24 92 28 102"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.13"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
