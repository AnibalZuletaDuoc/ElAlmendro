/**
 * TimeFlow - datos iniciales de desarrollo.
 *
 * Crea lo necesario para levantar el proyecto y ver el sistema funcionando:
 * usuarios, un proyecto con su sprint, un arbol de actividades y tres semanas
 * de historial de trabajo.
 *
 * El historial existe porque el calendario, los reportes y el panel del
 * administrador carecen de sentido sobre una base vacia: mostrarian cero en
 * todas partes y seria imposible saber si funcionan.
 *
 * Es idempotente: se apoya en upsert por correo y en comprobaciones de
 * existencia, de modo que puede ejecutarse las veces que haga falta.
 */
import {
  EstadoActividad,
  EstadoSprint,
  Prioridad,
  PrismaClient,
  Rol,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Solo para desarrollo local. En cualquier otro ambiente las credenciales
// se crean a mano y nunca se versionan.
const CLAVE_DEMO = 'Timeflow2026!';

/** Dias habiles hacia atras que se generan de historial. */
const DIAS_HISTORIAL = 21;

async function main() {
  const hash = await argon2.hash(CLAVE_DEMO);

  // ----------------------------------------------------------- usuarios

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@timeflow.cl' },
    update: {},
    create: {
      email: 'admin@timeflow.cl',
      hashContrasena: hash,
      nombreCompleto: 'Administrador TimeFlow',
      rol: Rol.ADMINISTRADOR,
    },
  });

  const trabajador = await prisma.usuario.upsert({
    where: { email: 'trabajador@timeflow.cl' },
    update: {},
    create: {
      email: 'trabajador@timeflow.cl',
      hashContrasena: hash,
      nombreCompleto: 'Camila Soto',
      rol: Rol.TRABAJADOR,
    },
  });

  const segundo = await prisma.usuario.upsert({
    where: { email: 'trabajador2@timeflow.cl' },
    update: {},
    create: {
      email: 'trabajador2@timeflow.cl',
      hashContrasena: hash,
      nombreCompleto: 'Diego Fuentes',
      rol: Rol.TRABAJADOR,
    },
  });

  // ----------------------------------------------------------- proyecto

  let proyecto = await prisma.proyecto.findFirst({
    where: { nombre: 'Plataforma El Almendro' },
  });
  if (!proyecto) {
    proyecto = await prisma.proyecto.create({
      data: {
        nombre: 'Plataforma El Almendro',
        descripcion: 'Proyecto de ejemplo para el entorno de desarrollo.',
        propietarioId: admin.id,
        miembros: {
          create: [
            { usuarioId: admin.id, rolEnProyecto: 'LIDER' },
            { usuarioId: trabajador.id, rolEnProyecto: 'MIEMBRO' },
            { usuarioId: segundo.id, rolEnProyecto: 'MIEMBRO' },
          ],
        },
      },
    });
  }

  let sprint = await prisma.sprint.findFirst({
    where: { proyectoId: proyecto.id, nombre: 'Sprint 1' },
  });
  if (!sprint) {
    sprint = await prisma.sprint.create({
      data: {
        proyectoId: proyecto.id,
        nombre: 'Sprint 1',
        objetivo: 'Definicion funcional y tecnica.',
        fechaInicio: diasAtras(21),
        fechaTermino: diasAdelante(7),
        estado: EstadoSprint.EN_CURSO,
      },
    });
  }

  // --------------------------------------------------------- actividades
  //
  // Tres agrupaciones con sus hijas. La jerarquia padre-hija es la que
  // alimenta el mapa de nodos: un nodo es una actividad y una agrupacion es
  // una actividad con hijas.

  const yaHayActividades = await prisma.actividad.count({
    where: { proyectoId: proyecto.id },
  });

  if (yaHayActividades === 0) {
    const grupos: {
      titulo: string;
      x: number;
      hijas: {
        titulo: string;
        estado: EstadoActividad;
        responsable: string;
        estimadas: number;
        prioridad: Prioridad;
        subtareas?: string[];
      }[];
    }[] = [
      {
        titulo: 'Acceso y seguridad',
        x: 0,
        hijas: [
          {
            titulo: 'Pantalla de inicio de sesion',
            estado: EstadoActividad.COMPLETADA,
            responsable: trabajador.id,
            estimadas: 240,
            prioridad: Prioridad.ALTA,
            subtareas: ['Formulario y validaciones', 'Manejo de errores'],
          },
          {
            titulo: 'Emision y rotacion de tokens',
            estado: EstadoActividad.EN_PROGRESO,
            responsable: trabajador.id,
            estimadas: 300,
            prioridad: Prioridad.ALTA,
            subtareas: ['Token de acceso', 'Deteccion de reutilizacion'],
          },
          {
            titulo: 'Control de acceso por rol',
            estado: EstadoActividad.PENDIENTE,
            responsable: segundo.id,
            estimadas: 180,
            prioridad: Prioridad.MEDIA,
          },
        ],
      },
      {
        titulo: 'Registro de jornada',
        x: 1,
        hijas: [
          {
            titulo: 'Marca de entrada y salida',
            estado: EstadoActividad.COMPLETADA,
            responsable: trabajador.id,
            estimadas: 200,
            prioridad: Prioridad.ALTA,
          },
          {
            titulo: 'Cierre automatico de sesiones',
            estado: EstadoActividad.BLOQUEADA,
            responsable: segundo.id,
            estimadas: 240,
            prioridad: Prioridad.CRITICA,
          },
          {
            titulo: 'Cronometro de actividad',
            estado: EstadoActividad.EN_PROGRESO,
            responsable: trabajador.id,
            estimadas: 360,
            prioridad: Prioridad.ALTA,
            subtareas: ['Iniciar y pausar', 'Cerrar con desenlace'],
          },
        ],
      },
      {
        titulo: 'Seguimiento y reportes',
        x: 2,
        hijas: [
          {
            titulo: 'Calendario del administrador',
            estado: EstadoActividad.EN_PROGRESO,
            responsable: segundo.id,
            estimadas: 300,
            prioridad: Prioridad.MEDIA,
          },
          {
            titulo: 'Reporte de horas por periodo',
            estado: EstadoActividad.PENDIENTE,
            responsable: trabajador.id,
            estimadas: 240,
            prioridad: Prioridad.MEDIA,
          },
          {
            titulo: 'Mapa de nodos del flujo',
            estado: EstadoActividad.INCONCLUSA,
            responsable: segundo.id,
            estimadas: 420,
            prioridad: Prioridad.BAJA,
          },
        ],
      },
    ];

    for (const grupo of grupos) {
      const padre = await prisma.actividad.create({
        data: {
          proyectoId: proyecto.id,
          sprintId: sprint.id,
          titulo: grupo.titulo,
          descripcion: `Agrupacion de actividades de ${grupo.titulo.toLowerCase()}.`,
          responsableId: admin.id,
          prioridad: Prioridad.ALTA,
          posicionNodo: { x: grupo.x * 320, y: 0 },
        },
      });

      for (const [i, hija] of grupo.hijas.entries()) {
        await prisma.actividad.create({
          data: {
            proyectoId: proyecto.id,
            sprintId: sprint.id,
            actividadPadreId: padre.id,
            titulo: hija.titulo,
            descripcion:
              'Actividad de ejemplo cargada con los datos iniciales del proyecto.',
            estado: hija.estado,
            prioridad: hija.prioridad,
            responsableId: hija.responsable,
            minutosEstimados: hija.estimadas,
            orden: i,
            posicionNodo: { x: grupo.x * 320, y: 140 + i * 110 },
            subtareas: hija.subtareas
              ? {
                  create: hija.subtareas.map((titulo, orden) => ({
                    titulo,
                    orden,
                    completada: orden === 0,
                  })),
                }
              : undefined,
          },
        });
      }
    }

    // Una derivacion, para que el historial de US-06 no este vacio.
    const bloqueada = await prisma.actividad.findFirst({
      where: { titulo: 'Cierre automatico de sesiones' },
    });
    if (bloqueada) {
      await prisma.derivacion.create({
        data: {
          actividadId: bloqueada.id,
          deUsuarioId: trabajador.id,
          aUsuarioId: segundo.id,
          motivo: 'Requiere revisar la tarea programada de autocierre.',
          ocurridoEn: diasAtras(4),
        },
      });
    }
  }

  // ----------------------------------------------------------- historial

  await generarHistorial(trabajador.id, segundo.id, proyecto.id);

  console.log('\n  Datos iniciales listos.\n');
  console.log(`    admin@timeflow.cl        / ${CLAVE_DEMO}   (administrador)`);
  console.log(`    trabajador@timeflow.cl   / ${CLAVE_DEMO}   (Camila Soto)`);
  console.log(`    trabajador2@timeflow.cl  / ${CLAVE_DEMO}   (Diego Fuentes)\n`);
}

/**
 * Genera jornadas y sesiones de trabajo de las ultimas tres semanas.
 *
 * Los tramos de un mismo trabajador no pueden solaparse —la base lo impide con
 * una restriccion de exclusion—, de modo que las sesiones de cada dia se
 * encadenan una despues de otra dentro de la jornada.
 */
async function generarHistorial(
  trabajadorId: string,
  segundoId: string,
  proyectoId: string,
) {
  const yaHayHistorial = await prisma.sesionTrabajo.count();
  if (yaHayHistorial > 0) return;

  const actividades = await prisma.actividad.findMany({
    where: { proyectoId, actividadPadreId: { not: null } },
    select: { id: true, responsableId: true },
  });

  const porTrabajador = new Map<string, string[]>([
    [trabajadorId, actividades.filter((a) => a.responsableId === trabajadorId).map((a) => a.id)],
    [segundoId, actividades.filter((a) => a.responsableId === segundoId).map((a) => a.id)],
  ]);

  // Patron de dedicacion por dia: minutos de cada sesion. Los dias vacios son
  // ausencias, que existen en cualquier registro real.
  const patron: number[][] = [
    [95, 140, 60],
    [180, 75],
    [],
    [120, 90, 45],
    [200],
    [60, 160, 80],
    [],
  ];

  for (const [usuarioId, ids] of porTrabajador) {
    if (ids.length === 0) continue;

    for (let dia = DIAS_HISTORIAL; dia >= 1; dia--) {
      const fecha = diasAtras(dia);
      const finDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
      if (finDeSemana) continue;

      const sesiones = patron[dia % patron.length];
      if (!sesiones || sesiones.length === 0) continue;

      // La jornada comienza entre las 08:30 y las 09:30 hora local.
      const inicioJornada = new Date(fecha);
      inicioJornada.setUTCHours(12 + (dia % 2), 30, 0, 0);

      let cursor = new Date(inicioJornada.getTime() + 10 * 60_000);
      const creadas: Date[] = [];

      const jornada = await prisma.jornada.create({
        data: {
          usuarioId,
          inicioEn: inicioJornada,
          estado: 'CERRADA',
          terminoEn: new Date(inicioJornada.getTime() + 9 * 3_600_000),
        },
      });

      for (const [i, minutos] of sesiones.entries()) {
        const actividadId = ids[(dia + i) % ids.length];
        const inicio = new Date(cursor);
        const termino = new Date(inicio.getTime() + minutos * 60_000);

        const sesion = await prisma.sesionTrabajo.create({
          data: {
            actividadId,
            usuarioId,
            jornadaId: jornada.id,
            inicioEn: inicio,
            terminoEn: termino,
            estado: 'CERRADA',
            desenlace: 'COMPLETADA',
            creadoEn: inicio,
          },
        });

        // Las sesiones largas se registran en dos tramos, con una pausa en
        // medio: es lo que ocurre en el uso real del cronometro.
        if (minutos > 120) {
          const corte = new Date(inicio.getTime() + Math.floor(minutos / 2) * 60_000);
          const reanuda = new Date(corte.getTime() + 15 * 60_000);
          await prisma.tramoSesion.createMany({
            data: [
              { sesionId: sesion.id, usuarioId, inicioEn: inicio, terminoEn: corte },
              {
                sesionId: sesion.id,
                usuarioId,
                inicioEn: reanuda,
                terminoEn: new Date(reanuda.getTime() + Math.ceil(minutos / 2) * 60_000),
              },
            ],
          });
          cursor = new Date(reanuda.getTime() + (Math.ceil(minutos / 2) + 20) * 60_000);
        } else {
          await prisma.tramoSesion.create({
            data: { sesionId: sesion.id, usuarioId, inicioEn: inicio, terminoEn: termino },
          });
          cursor = new Date(termino.getTime() + 20 * 60_000);
        }

        creadas.push(inicio);
      }

      if (creadas.length > 0) {
        await prisma.registroAuditoria.create({
          data: {
            actorId: usuarioId,
            accion: 'JORNADA_CERRADA',
            tipoEntidad: 'Jornada',
            entidadId: jornada.id,
            ocurridoEn: new Date(inicioJornada.getTime() + 9 * 3_600_000),
          },
        });
      }
    }
  }
}

function diasAtras(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

function diasAdelante(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
