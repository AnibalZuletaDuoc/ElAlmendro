'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ReactFlow, Background, Controls, Connection, Edge, Node, NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Marco from '@/components/Marco';
import NodoTarea, { DatosNodoTarea } from '@/components/nodos/NodoTarea';
import NodoRaiz, { DatosNodoRaiz } from '@/components/nodos/NodoRaiz';
import PanelTarea from '@/components/nodos/PanelTarea';
import { api, ErrorApi } from '@/lib/api';
import { Derivacion, NodoActividad } from '@/lib/tipos';
import { calcularArbolHorizontal } from '@/lib/mapaMental';

const RAIZ = 'raiz-proyecto';
const TIPOS_NODO = { raiz: NodoRaiz, tarea: NodoTarea };

/** US-05 y US-06 — mapa mental de tareas del proyecto y sus derivaciones. */
export default function Pagina() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-400">
          Cargando…
        </main>
      }
    >
      <Nodos />
    </Suspense>
  );
}

function Nodos() {
  const router = useRouter();
  const parametros = useSearchParams();
  const proyectoId = parametros.get('proyectoId');
  const nombreProyecto = parametros.get('nombre');

  const [actividades, setActividades] = useState<NodoActividad[]>([]);
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargas, setCargas] = useState(0);

  // El arbol parte siempre colapsado desde el proyecto: nada se despliega
  // hasta que el usuario lo pide.
  const [expandidoRaiz, setExpandidoRaiz] = useState(false);
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  const [tareaSeleccionada, setTareaSeleccionada] = useState<string | null>(null);

  const alHacerClicEnNodo: NodeMouseHandler = useCallback((_evento, nodo) => {
    if (nodo.id === RAIZ) return;
    setTareaSeleccionada(nodo.id);
  }, []);

  const cargar = useCallback(async () => {
    if (!proyectoId) return;
    const d = await api.get<{ actividades: NodoActividad[]; derivaciones: Derivacion[] }>(
      `/nodos?proyectoId=${proyectoId}`,
    );
    setActividades(d.actividades);
    setDerivaciones(d.derivaciones);
    setCargas((c) => c + 1);
  }, [proyectoId]);

  useEffect(() => {
    cargar().catch((err) => {
      if (err instanceof ErrorApi && err.estado === 401) router.replace('/login');
      else setAviso('No se pudo conectar con el servidor.');
    });
  }, [cargar, router]);

  const agregarTarea = useCallback(
    async (titulo: string, actividadPadreId?: string) => {
      if (!proyectoId) return;
      try {
        await api.post('/actividades', { proyectoId, titulo, actividadPadreId });
        // Al agregar una hija se despliega su padre, para que la tarea nueva
        // quede visible de inmediato en vez de perderse en una rama cerrada.
        if (actividadPadreId) {
          setExpandido((prev) => new Set(prev).add(actividadPadreId));
        } else {
          setExpandidoRaiz(true);
        }
        await cargar();
      } catch (err) {
        setAviso(err instanceof ErrorApi ? err.message : 'No se pudo crear la tarea.');
      }
    },
    [proyectoId, cargar],
  );

  const alConectar = useCallback(
    async (conexion: Connection) => {
      const origen = conexion.source;
      const destino = conexion.target;
      if (!origen || !destino || destino === RAIZ) return;
      const nuevoPadre = origen === RAIZ ? null : origen;
      try {
        await api.patch(`/actividades/${destino}`, { actividadPadreId: nuevoPadre });
        if (origen === RAIZ) setExpandidoRaiz(true);
        else setExpandido((prev) => new Set(prev).add(origen));
        await cargar();
      } catch (err) {
        setAviso(err instanceof ErrorApi ? err.message : 'No se pudo unir esa tarea.');
      }
    },
    [cargar],
  );

  function alternarRaiz() {
    setExpandidoRaiz((v) => !v);
  }

  function alternarNodo(id: string) {
    setExpandido((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  const { nodos, aristas } = useMemo(() => {
    const { posiciones, yRaiz, raicesProyecto } = calcularArbolHorizontal(
      actividades,
      expandidoRaiz,
      expandido,
    );
    const porId = new Map(actividades.map((a) => [a.id, a]));

    const nodos: Node[] = [];
    const aristas: Edge[] = [];

    if (nombreProyecto) {
      const datosRaiz: DatosNodoRaiz = {
        nombre: nombreProyecto,
        tieneHijos: raicesProyecto.length > 0,
        expandido: expandidoRaiz,
        onAlternar: alternarRaiz,
        onAgregarHija: (titulo: string) => agregarTarea(titulo),
      };
      nodos.push({ id: RAIZ, type: 'raiz', position: { x: 0, y: yRaiz }, data: datosRaiz });
    }

    for (const pos of posiciones.values()) {
      const a = porId.get(pos.id)!;
      const datos: DatosNodoTarea = {
        titulo: a.titulo,
        estado: a.estado,
        color: pos.color,
        tieneHijos: pos.tieneHijos,
        expandido: expandido.has(a.id),
        onAlternar: () => alternarNodo(a.id),
        onAgregarHija: (titulo: string) => agregarTarea(titulo, a.id),
      };
      nodos.push({ id: a.id, type: 'tarea', position: { x: pos.x, y: pos.y }, data: datos });

      const padreId = a.actividadPadreId && posiciones.has(a.actividadPadreId) ? a.actividadPadreId : null;
      if (padreId) {
        aristas.push({
          id: `${padreId}-${a.id}`,
          source: padreId,
          target: a.id,
          type: 'default',
          style: { stroke: pos.color, strokeWidth: 2, opacity: 0.55 },
        });
      } else if (pos.profundidad === 1 && nombreProyecto) {
        aristas.push({
          id: `${RAIZ}-${a.id}`,
          source: RAIZ,
          target: a.id,
          type: 'default',
          style: { stroke: pos.color, strokeWidth: 2.5, opacity: 0.7 },
        });
      }
    }

    return { nodos, aristas };
  }, [actividades, nombreProyecto, expandidoRaiz, expandido, agregarTarea]);

  if (!proyectoId) {
    return (
      <Marco activo="/nodos" titulo="Mapa de nodos" subtitulo="Flujo de tareas y derivaciones">
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/15 p-16 text-center">
          <p className="mb-4 max-w-sm text-sm text-slate-400">
            El mapa de nodos ahora se arma por proyecto. Elige un proyecto y entra desde
            &quot;Ir a las tareas&quot; para ver y editar su árbol de tareas.
          </p>
          <Link
            href="/panel"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-400"
          >
            Ir a Proyectos
          </Link>
        </div>
      </Marco>
    );
  }

  return (
    <Marco activo="/nodos" titulo="Mapa de nodos" subtitulo={`Tareas de "${nombreProyecto}"`}>
      {aviso && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300"
        >
          {aviso}
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur">
          <div style={{ height: '32rem' }}>
            <ReactFlow
              key={`${cargas}-${expandidoRaiz}-${expandido.size}-${[...expandido].sort().join(',')}`}
              nodes={nodos}
              edges={aristas}
              nodeTypes={TIPOS_NODO}
              onConnect={alConectar}
              onNodeClick={alHacerClicEnNodo}
              nodesDraggable={false}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              proOptions={{ hideAttribution: true }}
              colorMode="dark"
            >
              <Background color="rgba(255,255,255,0.08)" gap={18} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
          <p className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
            Haz clic en el circulo del borde de una burbuja para desplegar sus tareas, pasa el
            mouse sobre ella para agregarle una nueva, o arrastra desde su borde hacia otra para
            unirlas.
          </p>
        </section>

        <aside className="w-full shrink-0 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur lg:w-80">
          {tareaSeleccionada ? (
            <PanelTarea
              key={tareaSeleccionada}
              actividadId={tareaSeleccionada}
              onCerrar={() => setTareaSeleccionada(null)}
              onCambio={cargar}
            />
          ) : (
            <>
              <h2 className="mb-1 font-bold text-white">Derivaciones</h2>
              <p className="mb-4 text-xs text-slate-400">
                Traspasos de responsable, con su motivo y su fecha.
              </p>

              {derivaciones.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-xs text-slate-500">
                  Sin derivaciones registradas.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {derivaciones.map((d) => (
                    <div key={d.id} className="rounded-xl border border-white/10 p-3">
                      <p className="text-sm font-semibold leading-snug text-white">
                        {d.actividad.titulo}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {d.deUsuario.nombreCompleto} → {d.aUsuario.nombreCompleto}
                      </p>
                      <p className="mt-1.5 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-slate-300">
                        {d.motivo}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {new Date(d.ocurridoEn).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </Marco>
  );
}
