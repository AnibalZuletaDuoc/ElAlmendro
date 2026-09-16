'use client';

import { useState } from 'react';

export interface BarraDato {
  nombre: string;
  valor: number;
  /** Texto del valor ya formateado ("12,5 h"). */
  etiqueta: string;
}

const ALTO_FILA = 34;
const GROSOR_BARRA = 22;
const ANCHO_NOMBRE = 190;
const MARGEN_DERECHO = 64;
// sky-600: validado sobre la superficie oscura (contraste y banda de luminosidad).
const COLOR_BARRA = '#0284c7';
const COLOR_BARRA_ACTIVA = '#0ea5e9';

/**
 * Barras horizontales de una sola serie, en SVG puro. Reemplaza a Recharts,
 * que costaba ~100 kB de JavaScript en esta pantalla para dibujar solo esto.
 * El valor va al final de cada barra en color de texto; al pasar el mouse la
 * barra se resalta y aparece el detalle completo.
 */
export default function GraficoBarras({ datos, unidad }: { datos: BarraDato[]; unidad: string }) {
  const [activa, setActiva] = useState<number | null>(null);
  const maximo = Math.max(...datos.map((d) => d.valor), 0) || 1;
  const alto = datos.length * ALTO_FILA + 28;
  // Rejilla recesiva: 4 marcas redondas segun el maximo.
  const paso = pasoAgradable(maximo / 4);
  const marcas: number[] = [];
  for (let v = 0; v <= maximo; v += paso) marcas.push(v);

  return (
    <div className="relative overflow-x-auto">
      <svg
        viewBox={`0 0 720 ${alto}`}
        width="100%"
        height={alto}
        role="img"
        aria-label={`Horas por actividad, ${datos.length} actividades`}
        className="min-w-[34rem]"
        style={{ fontFamily: 'inherit' }}
        onMouseLeave={() => setActiva(null)}
      >
        {marcas.map((v) => {
          const x = ANCHO_NOMBRE + (v / maximo) * (720 - ANCHO_NOMBRE - MARGEN_DERECHO);
          return (
            <g key={v}>
              <line
                x1={x}
                x2={x}
                y1={0}
                y2={alto - 24}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 3"
              />
              <text x={x} y={alto - 8} textAnchor="middle" fontSize={11} fill="#94a3b8">
                {formatear(v)} {unidad}
              </text>
            </g>
          );
        })}

        {datos.map((d, i) => {
          const y = i * ALTO_FILA + (ALTO_FILA - GROSOR_BARRA) / 2;
          const ancho = Math.max(2, (d.valor / maximo) * (720 - ANCHO_NOMBRE - MARGEN_DERECHO));
          const esActiva = activa === i;
          return (
            <g
              key={d.nombre + i}
              onMouseEnter={() => setActiva(i)}
              onFocus={() => setActiva(i)}
              tabIndex={0}
              style={{ outline: 'none', cursor: 'default' }}
            >
              {/* Zona de impacto mas grande que la barra. */}
              <rect x={0} y={i * ALTO_FILA} width={720} height={ALTO_FILA} fill="transparent" />
              <text
                x={ANCHO_NOMBRE - 12}
                y={i * ALTO_FILA + ALTO_FILA / 2}
                dominantBaseline="middle"
                textAnchor="end"
                fontSize={11}
                fill={esActiva ? '#f1f5f9' : '#cbd5e1'}
              >
                {recortar(d.nombre, 30)}
              </text>
              {/* Extremo de datos redondeado (4 px), cuadrado en la base. */}
              <path
                d={caminoBarra(ANCHO_NOMBRE, y, ancho, GROSOR_BARRA, 4)}
                fill={esActiva ? COLOR_BARRA_ACTIVA : COLOR_BARRA}
              />
              <text
                x={ANCHO_NOMBRE + ancho + 8}
                y={y + GROSOR_BARRA / 2}
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
                fill="#e2e8f0"
              >
                {d.etiqueta}
              </text>
            </g>
          );
        })}
      </svg>

      {activa !== null && datos[activa] && (
        <div
          className="pointer-events-none absolute left-3 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-200 shadow-xl"
          style={{ top: activa * ALTO_FILA + ALTO_FILA + 2 }}
        >
          <span className="font-semibold text-white">{datos[activa].etiqueta}</span>{' '}
          <span className="text-slate-400">· {datos[activa].nombre}</span>
        </div>
      )}
    </div>
  );
}

function caminoBarra(x: number, y: number, ancho: number, alto: number, radio: number): string {
  const r = Math.min(radio, ancho / 2, alto / 2);
  return [
    `M ${x} ${y}`,
    `H ${x + ancho - r}`,
    `A ${r} ${r} 0 0 1 ${x + ancho} ${y + r}`,
    `V ${y + alto - r}`,
    `A ${r} ${r} 0 0 1 ${x + ancho - r} ${y + alto}`,
    `H ${x}`,
    'Z',
  ].join(' ');
}

function pasoAgradable(bruto: number): number {
  if (bruto <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const normalizado = bruto / potencia;
  const base = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  return base * potencia;
}

function formatear(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
}

function recortar(texto: string, maximo: number): string {
  return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;
}
