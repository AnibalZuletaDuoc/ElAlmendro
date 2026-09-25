'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTesoro } from '@/lib/tesoro';
import BolsaOro from './BolsaOro';
import ContenidoBolsa from './ContenidoBolsa';

const CLAVE_POSICION = 'tf_bolsa_posicion';
const ANCHO = 340;
const ANCHO_MINI = 232;
const MARGEN = 12;

interface Posicion {
  x: number;
  y: number;
}

/** La API de ventana flotante del navegador (Chrome y Edge). */
interface ApiVentanaFlotante {
  requestWindow(opciones?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}
function apiVentanaFlotante(): ApiVentanaFlotante | null {
  const api = (window as unknown as { documentPictureInPicture?: ApiVentanaFlotante })
    .documentPictureInPicture;
  return api && typeof api.requestWindow === 'function' ? api : null;
}

/**
 * Ventana de la bolsa abierta.
 *
 * Tiene dos formas: pegada a la pagina —se arrastra por su barra y se encoge a
 * una pastilla— o desprendida en una ventana propia del navegador, que queda
 * por encima de todo y sobrevive al cambio de pestana, como la ventanita de
 * una videollamada. Vive en el layout raiz, de modo que navegar entre
 * pantallas no la cierra.
 */
export default function VentanaBolsa() {
  const { bolsa, cerrarBolsa, volarAlCofre, notificarCambio } = useTesoro();

  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [minimizada, setMinimizada] = useState(false);
  const [ventanaAparte, setVentanaAparte] = useState<Window | null>(null);
  const [contenedorAparte, setContenedorAparte] = useState<HTMLElement | null>(null);
  // Tamano de la ventana desprendida: entera o encogida al cronometro.
  const [soloReloj, setSoloReloj] = useState(false);

  const ventana = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ dx: number; dy: number } | null>(null);

  const ancho = minimizada ? ANCHO_MINI : ANCHO;

  // ------------------------------------------------------------- posicion

  const limitar = useCallback((p: Posicion, anchoActual: number): Posicion => {
    const alto = ventana.current?.offsetHeight ?? 260;
    return {
      x: Math.max(MARGEN, Math.min(p.x, window.innerWidth - anchoActual - MARGEN)),
      y: Math.max(MARGEN, Math.min(p.y, window.innerHeight - alto - MARGEN)),
    };
  }, []);

  useEffect(() => {
    if (!bolsa) return;
    let inicial: Posicion | null = null;
    try {
      const crudo = window.localStorage.getItem(CLAVE_POSICION);
      if (crudo) inicial = JSON.parse(crudo) as Posicion;
    } catch {
      /* sin posicion guardada */
    }
    setPosicion((previa) =>
      previa ??
      limitar(inicial ?? { x: window.innerWidth - ANCHO - 24, y: window.innerHeight - 420 }, ANCHO),
    );
  }, [bolsa, limitar]);

  useEffect(() => {
    if (!bolsa) return;
    const alRedimensionar = () => setPosicion((p) => (p ? limitar(p, ancho) : p));
    window.addEventListener('resize', alRedimensionar);
    return () => window.removeEventListener('resize', alRedimensionar);
  }, [bolsa, ancho, limitar]);

  function iniciarArrastre(e: React.PointerEvent) {
    if (!posicion) return;
    if ((e.target as HTMLElement).closest('button')) return;
    arrastre.current = { dx: e.clientX - posicion.x, dy: e.clientY - posicion.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function moverArrastre(e: React.PointerEvent) {
    if (!arrastre.current) return;
    e.preventDefault();
    setPosicion(
      limitar({ x: e.clientX - arrastre.current.dx, y: e.clientY - arrastre.current.dy }, ancho),
    );
  }

  function soltarArrastre(e: React.PointerEvent) {
    if (!arrastre.current) return;
    arrastre.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    try {
      if (posicion) window.localStorage.setItem(CLAVE_POSICION, JSON.stringify(posicion));
    } catch {
      /* sin persistencia: vuelve a su esquina por defecto */
    }
  }

  // ------------------------------------------------- ventana independiente

  /**
   * Copia los estilos de la pagina a la ventana nueva: es otro documento y
   * no hereda nada, asi que sin esto llegaria sin formato.
   */
  function copiarEstilos(destino: Window) {
    for (const hoja of Array.from(document.styleSheets)) {
      try {
        const css = Array.from(hoja.cssRules)
          .map((r) => r.cssText)
          .join('\n');
        const estilo = destino.document.createElement('style');
        estilo.textContent = css;
        destino.document.head.appendChild(estilo);
      } catch {
        // Hoja de otro origen: no se puede leer, pero si enlazar.
        if (hoja.href) {
          const enlace = destino.document.createElement('link');
          enlace.rel = 'stylesheet';
          enlace.href = hoja.href;
          destino.document.head.appendChild(enlace);
        }
      }
    }
  }

  async function desprender() {
    if (!bolsa) return;
    const api = apiVentanaFlotante();

    // Sin soporte para la ventana flotante (Firefox, Safari): se abre una
    // ventana normal con la pantalla suelta de la bolsa.
    if (!api) {
      window.open(
        `/bolsa/${bolsa.id}`,
        `bolsa-${bolsa.id}`,
        'popup=yes,width=400,height=620,noopener=no',
      );
      cerrarBolsa();
      return;
    }

    const nueva = await api.requestWindow({ width: 380, height: 600 });
    copiarEstilos(nueva);
    nueva.document.title = `Bolsa · ${bolsa.titulo}`;
    nueva.document.body.style.margin = '0';
    nueva.document.body.style.background = '#0f172a';

    const caja = nueva.document.createElement('div');
    caja.className = 'min-h-screen bg-slate-950 text-slate-100';
    nueva.document.body.appendChild(caja);

    // Al cerrarla, la bolsa vuelve a la pagina.
    nueva.addEventListener('pagehide', () => {
      setVentanaAparte(null);
      setContenedorAparte(null);
      setSoloReloj(false);
    });

    setSoloReloj(false);
    setVentanaAparte(nueva);
    setContenedorAparte(caja);
  }

  /**
   * Encoge o devuelve su tamano a la ventana desprendida. Se redimensiona la
   * ventana de verdad, no solo su contenido: encogida ocupa lo justo para el
   * cronometro y estorba menos sobre cualquier otra aplicacion.
   */
  function cambiarTamanoAparte(reloj: boolean) {
    setSoloReloj(reloj);
    try {
      ventanaAparte?.resizeTo(reloj ? 260 : 380, reloj ? 170 : 600);
    } catch {
      /* el navegador no deja redimensionarla: al menos cambia el contenido */
    }
  }

  useEffect(() => {
    // Si se cierra la bolsa, tambien se cierra su ventana aparte.
    if (!bolsa && ventanaAparte) {
      ventanaAparte.close();
      setVentanaAparte(null);
      setContenedorAparte(null);
    }
  }, [bolsa, ventanaAparte]);

  if (!bolsa) return null;

  const contenido = (
    <ContenidoBolsa
      bolsaId={bolsa.id}
      titulo={bolsa.titulo}
      modo={
        contenedorAparte
          ? soloReloj
            ? 'reloj'
            : 'completo'
          : minimizada
            ? 'barra'
            : 'completo'
      }
      onExpandir={() => (contenedorAparte ? cambiarTamanoAparte(false) : setMinimizada(false))}
      onCambio={notificarCambio}
      onGuardada={(origen) => {
        // Desde la ventana aparte el recuadro pertenece a otro documento: el
        // vuelo sale entonces desde el centro de la pagina principal.
        const desde =
          origen && !ventanaAparte
            ? origen
            : new DOMRect(window.innerWidth / 2 - 40, window.innerHeight / 2 - 40, 80, 80);
        volarAlCofre(desde);
      }}
    />
  );

  // ------------------------------------------- desprendida en otra ventana
  if (contenedorAparte) {
    return (
      <>
        {createPortal(
          <>
            {/* Barra propia de la ventana desprendida. */}
            <div className="flex items-center gap-1 border-b border-white/10 bg-white/5 px-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-wide text-amber-200/70">
                {soloReloj ? 'Cronometro' : 'Bolsa'}
              </span>
              <button
                onClick={() => cambiarTamanoAparte(!soloReloj)}
                title={soloReloj ? 'Ver la bolsa completa' : 'Dejar solo el cronometro'}
                className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                {soloReloj ? '⤢' : '—'}
              </button>
              <button
                onClick={() => ventanaAparte?.close()}
                title="Traer de vuelta a la pagina"
                className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ⤡
              </button>
            </div>
            {contenido}
          </>,
          contenedorAparte,
        )}
        <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-xl border border-amber-500/25 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur">
          <BolsaOro llenado={1} tamano={26} animada={false} />
          <span className="max-w-[10rem] truncate text-xs text-slate-300">{bolsa.titulo}</span>
          <span className="text-[10px] text-amber-300/80">en ventana aparte</span>
          <button
            onClick={() => ventanaAparte?.close()}
            title="Traer de vuelta a esta pagina"
            className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ⤡
          </button>
        </div>
      </>
    );
  }

  if (!posicion) return null;

  // ------------------------------------------------- pegada a la pagina
  return (
    <div
      ref={ventana}
      className="fixed z-[60] overflow-hidden rounded-2xl border border-amber-500/25 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur"
      style={{ left: posicion.x, top: posicion.y, width: ancho }}
      role="dialog"
      aria-label={`Bolsa: ${bolsa.titulo}`}
    >
      <div
        onPointerDown={iniciarArrastre}
        onPointerMove={moverArrastre}
        onPointerUp={soltarArrastre}
        onPointerCancel={soltarArrastre}
        className="flex cursor-grab touch-none items-center gap-1.5 border-b border-white/10 bg-white/5 px-3 py-2 active:cursor-grabbing"
      >
        <span className="text-slate-500" aria-hidden>
          ⠿
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-wide text-amber-200/80">
          Bolsa abierta
        </span>
        <button
          onClick={desprender}
          title="Sacarla en una ventana aparte, siempre visible"
          className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          ⧉
        </button>
        <button
          onClick={() => {
            setMinimizada((v) => !v);
            setPosicion((p) => (p ? limitar(p, minimizada ? ANCHO : ANCHO_MINI) : p));
          }}
          title={minimizada ? 'Expandir' : 'Minimizar'}
          className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {minimizada ? '⤢' : '—'}
        </button>
        <button
          onClick={cerrarBolsa}
          title="Cerrar"
          className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className={minimizada ? '' : 'max-h-[min(70vh,34rem)] overflow-y-auto'}>
        {contenido}
      </div>
    </div>
  );
}
