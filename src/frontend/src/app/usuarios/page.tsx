'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PERMISOS, Rol, ROLES_CATALOGO } from '@/lib/rbac';
import Marco from '@/components/Marco';
import { api, ErrorApi, RolCatalogoItem, UsuarioItem } from '@/lib/api';
import { iniciales } from '@/lib/formato';
import { useSesion } from '@/lib/sesion';

export default function UsuariosPage() {
  return (
    <Marco
      activo="/usuarios"
      titulo="Administración de Usuarios y Roles"
      subtitulo="Gestión del equipo de trabajo y control de permisos (RBAC)"
    >
      <ContenidoUsuarios />
    </Marco>
  );
}

function ContenidoUsuarios() {
  const router = useRouter();
  const sesionActual = useSesion();

  // Al estar dentro de Marco, sesionActual ya viene resuelto desde ContextoSesion.Provider
  const esAdmin = sesionActual?.rol === 'ADMINISTRADOR';
  const puedeVer =
    esAdmin || (sesionActual?.permisos?.includes(PERMISOS.USUARIOS_VER) ?? false);
  const puedeGestionar =
    esAdmin ||
    (sesionActual?.permisos?.includes(PERMISOS.USUARIOS_GESTIONAR) ?? false);

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [rolesCatalogo, setRolesCatalogo] = useState<RolCatalogoItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioItem | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [lista, roles] = await Promise.all([
        api.get<UsuarioItem[]>('/usuarios'),
        api.get<RolCatalogoItem[]>('/usuarios/roles'),
      ]);
      setUsuarios(lista);
      setRolesCatalogo(roles.length ? roles : (ROLES_CATALOGO as any));
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err instanceof ErrorApi ? err.message : 'Error al conectar con la API de usuarios.',
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [puedeVer, cargarDatos]);

  // Si el usuario no tiene permisos para ver este módulo
  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-600 font-bold text-lg">
          ✕
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido</h2>
        <p className="mt-1 text-sm text-slate-500">
          No posees los permisos necesarios para administrar usuarios ni roles del sistema.
        </p>
        <button
          onClick={() => router.push('/panel')}
          className="mt-5 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Volver a mis actividades
        </button>
      </div>
    );
  }

  // Filtrado reactivo en cliente
  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideBusqueda =
      !busqueda.trim() ||
      u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase());

    const coincideRol = filtroRol === 'TODOS' || u.rol === filtroRol;

    const coincideEstado =
      filtroEstado === 'TODOS' ||
      (filtroEstado === 'ACTIVOS' && u.activo) ||
      (filtroEstado === 'INACTIVOS' && !u.activo);

    return coincideBusqueda && coincideRol && coincideEstado;
  });

  // Métricas de resumen
  const metricas = {
    total: usuarios.length,
    admins: usuarios.filter((u) => u.rol === 'ADMINISTRADOR').length,
    supervisores: usuarios.filter((u) => u.rol === 'SUPERVISOR').length,
    trabajadores: usuarios.filter((u) => u.rol === 'TRABAJADOR').length,
    activos: usuarios.filter((u) => u.activo).length,
  };

  async function handleDesactivar(u: UsuarioItem) {
    if (!puedeGestionar) return;
    const accionTexto = u.activo ? 'desactivar' : 'reactivar';
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas ${accionTexto} a ${u.nombreCompleto}?`,
    );
    if (!confirmacion) return;

    try {
      if (u.activo) {
        await api.delete(`/usuarios/${u.id}`);
      } else {
        await api.patch(`/usuarios/${u.id}`, { activo: true });
      }
      setMensaje({
        tipo: 'exito',
        texto: `Usuario ${u.nombreCompleto} ${u.activo ? 'desactivado' : 'reactivado'} exitosamente.`,
      });
      await cargarDatos();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err instanceof ErrorApi ? err.message : 'No se pudo actualizar el estado del usuario.',
      });
    }
  }

  return (
    <>
      {mensaje && (
        <div
          role="alert"
          className={`mb-5 flex items-center justify-between rounded-xl border p-4 text-sm ${
            mensaje.tipo === 'exito'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>{mensaje.texto}</span>
          <button
            onClick={() => setMensaje(null)}
            className="text-xs font-bold uppercase opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {sesionActual?.rol === 'SUPERVISOR' && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-900">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-sky-200 text-sky-950 font-bold">
            i
          </div>
          <div>
            <span className="font-semibold">Modo Supervisor:</span> Tienes autorización para supervisar las operaciones del área y gestionar a los trabajadores a tu cargo. Las cuentas de administradores y la configuración crítica del sistema están protegidas.
          </div>
        </div>
      )}

      {/* -------------------- Tarjetas de métricas -------------------- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <TarjetaMetrica
          etiqueta="Total Equipo"
          valor={metricas.total}
          subtexto={`${metricas.activos} activos`}
        />
        <TarjetaMetrica
          etiqueta="Administradores"
          valor={metricas.admins}
          subtexto="Acceso global"
          color="indigo"
        />
        <TarjetaMetrica
          etiqueta="Supervisores"
          valor={metricas.supervisores}
          subtexto="Monitoreo"
          color="sky"
        />
        <TarjetaMetrica
          etiqueta="Trabajadores"
          valor={metricas.trabajadores}
          subtexto="Cronometraje"
          color="emerald"
        />
        <TarjetaMetrica
          etiqueta="Inactivos"
          valor={metricas.total - metricas.activos}
          subtexto="Acceso restringido"
          color="slate"
        />
      </div>

      {/* -------------------- Barra de herramientas y filtros -------------------- */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex min-w-[18rem] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm focus-within:border-orange-400 focus-within:bg-white">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o correo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="text-xs text-slate-400 hover:text-slate-600">
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            aria-label="Filtrar por rol"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
          >
            <option value="TODOS">Todos los roles</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="TRABAJADOR">Trabajador</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Solo Activos</option>
            <option value="INACTIVOS">Solo Inactivos</option>
          </select>

          {puedeGestionar && (
            <button
              onClick={() => setModalCrearAbierto(true)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-orange-700"
            >
              <span className="text-base leading-none">+</span>
              <span>Nuevo Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------- Tabla de usuarios -------------------- */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {cargando ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Cargando nómina de usuarios…
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            No se encontraron usuarios con los criterios de búsqueda especificados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Usuario</th>
                  <th className="px-6 py-3.5">Rol y Permisos</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5">Zona Horaria</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const esPropiaCuenta = sesionActual?.id === u.id;
                  return (
                    <tr key={u.id} className="transition hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-xs font-bold text-orange-700">
                            {iniciales(u.nombreCompleto)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {u.nombreCompleto}
                              {esPropiaCuenta && (
                                <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <BadgeRol rol={u.rol} />
                        <p className="mt-1 text-[11px] text-slate-400">
                          {u.permisos?.length ?? 0} permiso(s) asignado(s)
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {u.zonaHoraria || 'America/Santiago'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {puedeGestionar && (
                          <div className="flex items-center justify-end gap-2">
                            {esAdmin || u.rol === 'TRABAJADOR' ? (
                              <>
                                <button
                                  onClick={() => setUsuarioEditando(u)}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                >
                                  Editar
                                </button>

                                {!esPropiaCuenta && (
                                  <button
                                    onClick={() => handleDesactivar(u)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                      u.activo
                                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {u.activo ? 'Desactivar' : 'Activar'}
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">
                                Protegido
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -------------------- Modal: Crear Usuario -------------------- */}
      {modalCrearAbierto && (
        <ModalCrearUsuario
          roles={rolesCatalogo}
          rolOperador={sesionActual?.rol}
          onCerrar={() => setModalCrearAbierto(false)}
          onGuardado={async () => {
            setModalCrearAbierto(false);
            setMensaje({ tipo: 'exito', texto: 'Usuario creado exitosamente.' });
            await cargarDatos();
          }}
        />
      )}

      {/* -------------------- Modal: Editar Usuario -------------------- */}
      {usuarioEditando && (
        <ModalEditarUsuario
          usuario={usuarioEditando}
          roles={rolesCatalogo}
          rolOperador={sesionActual?.rol}
          onCerrar={() => setUsuarioEditando(null)}
          onGuardado={async () => {
            setUsuarioEditando(null);
            setMensaje({ tipo: 'exito', texto: 'Usuario actualizado exitosamente.' });
            await cargarDatos();
          }}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------- Componentes Auxiliares

function TarjetaMetrica({
  etiqueta,
  valor,
  subtexto,
  color = 'orange',
}: {
  etiqueta: string;
  valor: number;
  subtexto: string;
  color?: 'orange' | 'indigo' | 'sky' | 'emerald' | 'slate';
}) {
  const colores = {
    orange: 'border-orange-200/70 bg-orange-50/40 text-orange-700',
    indigo: 'border-indigo-200/70 bg-indigo-50/40 text-indigo-700',
    sky: 'border-sky-200/70 bg-sky-50/40 text-sky-700',
    emerald: 'border-emerald-200/70 bg-emerald-50/40 text-emerald-700',
    slate: 'border-slate-200/70 bg-slate-50/40 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${colores[color]}`}>
      <p className="text-xs font-medium text-slate-500">{etiqueta}</p>
      <p className="my-1 text-2xl font-bold tracking-tight text-slate-900">{valor}</p>
      <p className="text-[11px] text-slate-400">{subtexto}</p>
    </div>
  );
}

function BadgeRol({ rol }: { rol: Rol }) {
  switch (rol) {
    case 'ADMINISTRADOR':
      return (
        <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
          Administrador
        </span>
      );
    case 'SUPERVISOR':
      return (
        <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
          Supervisor
        </span>
      );
    case 'TRABAJADOR':
    default:
      return (
        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          Trabajador
        </span>
      );
  }
}

// ------------------------------------------------------------- Modal: Crear Usuario

function ModalCrearUsuario({
  roles,
  rolOperador,
  onCerrar,
  onGuardado,
}: {
  roles: RolCatalogoItem[];
  rolOperador?: Rol;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState<Rol>('TRABAJADOR');
  const [zonaHoraria, setZonaHoraria] = useState('America/Santiago');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api.post('/usuarios', {
        nombreCompleto,
        email,
        contrasena,
        rol,
        zonaHoraria,
      });
      await onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setEnviando(false);
    }
  }

  const rolSeleccionado = roles.find((r) => r.codigo === rol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-800">Registrar Nuevo Trabajador</h2>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre Completo</label>
            <input
              type="text"
              required
              placeholder="Ej: Marcelo Morales"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="nombre@timeflow.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Contraseña Inicial</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Rol en el Sistema (RBAC)</label>
            <select
              value={rol}
              disabled={rolOperador === 'SUPERVISOR'}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="TRABAJADOR">Trabajador (Registro de tiempo y actividades)</option>
              {rolOperador !== 'SUPERVISOR' && (
                <>
                  <option value="SUPERVISOR">Supervisor (Monitoreo de equipo y reportes)</option>
                  <option value="ADMINISTRADOR">Administrador (Control total del sistema)</option>
                </>
              )}
            </select>
            {rolOperador === 'SUPERVISOR' && (
              <p className="mt-1 text-xs text-sky-600">
                Como supervisor, gestionas exclusivamente trabajadores a tu cargo.
              </p>
            )}
            {rolSeleccionado && (
              <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                {rolSeleccionado.descripcion}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Zona Horaria</label>
            <input
              type="text"
              value={zonaHoraria}
              onChange={(e) => setZonaHoraria(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 font-mono text-xs"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {enviando ? 'Guardando…' : 'Crear Trabajador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- Modal: Editar Usuario

function ModalEditarUsuario({
  usuario,
  roles,
  rolOperador,
  onCerrar,
  onGuardado,
}: {
  usuario: UsuarioItem;
  roles: RolCatalogoItem[];
  rolOperador?: Rol;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const [nombreCompleto, setNombreCompleto] = useState(usuario.nombreCompleto);
  const [email, setEmail] = useState(usuario.email);
  const [rol, setRol] = useState<Rol>(usuario.rol);
  const [activo, setActivo] = useState(usuario.activo);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [zonaHoraria, setZonaHoraria] = useState(usuario.zonaHoraria || 'America/Santiago');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const cuerpo: any = {
        nombreCompleto,
        email: email.trim(),
        rol,
        activo,
        zonaHoraria,
      };

      if (nuevaContrasena.trim().length >= 8) {
        cuerpo.contrasena = nuevaContrasena.trim();
      }

      await api.patch(`/usuarios/${usuario.id}`, cuerpo);
      await onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo actualizar el usuario.');
    } finally {
      setEnviando(false);
    }
  }

  const rolSeleccionado = roles.find((r) => r.codigo === rol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Editar Usuario</h2>
            <p className="text-xs text-slate-400">{usuario.email}</p>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre Completo</label>
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Correo Electrónico (Ingreso)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Rol Asignado (RBAC)</label>
            <select
              value={rol}
              disabled={rolOperador === 'SUPERVISOR'}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="TRABAJADOR">Trabajador</option>
              {rolOperador !== 'SUPERVISOR' && (
                <>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </>
              )}
            </select>
            {rolOperador === 'SUPERVISOR' && (
              <p className="mt-1 text-xs text-sky-600">
                La asignación o modificación de roles superiores está reservada a administradores.
              </p>
            )}
            {rolSeleccionado && (
              <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                {rolSeleccionado.descripcion}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <input
              type="checkbox"
              id="activo-check"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded-sm text-orange-600 focus:ring-orange-400"
            />
            <label htmlFor="activo-check" className="text-sm font-medium text-slate-700">
              Usuario Activo (permite iniciar sesión en la plataforma)
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Nueva Contraseña <span className="font-normal text-slate-400">(dejar en blanco para conservar la actual)</span>
            </label>
            <input
              type="password"
              minLength={8}
              placeholder="Opcional: ingresar nueva contraseña"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {enviando ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
