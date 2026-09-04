/**
 * TimeFlow - datos iniciales de desarrollo.
 *
 * Crea el minimo necesario para que cualquier integrante del equipo pueda
 * levantar el proyecto y trabajar: dos usuarios (administrador y trabajador),
 * un proyecto, un sprint y un arbol de actividades de ejemplo.
 *
 * Es idempotente: se apoya en upsert por email / nombre, de modo que puede
 * ejecutarse varias veces sin duplicar datos.
 */
import { PrismaClient, Rol, EstadoSprint, Prioridad } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Solo para desarrollo local. En cualquier otro ambiente las credenciales
// se crean a mano y nunca se versionan.
const CLAVE_DEMO = 'Timeflow2026!';

async function main() {
  const hash = await argon2.hash(CLAVE_DEMO);

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
      nombreCompleto: 'Trabajador de prueba',
      rol: Rol.TRABAJADOR,
    },
  });

  let proyecto = await prisma.proyecto.findFirst({
    where: { nombre: 'Proyecto demo' },
  });
  if (!proyecto) {
    proyecto = await prisma.proyecto.create({
      data: {
        nombre: 'Proyecto demo',
        descripcion: 'Proyecto de ejemplo para el entorno de desarrollo.',
        propietarioId: admin.id,
        miembros: {
          create: [
            { usuarioId: admin.id, rolEnProyecto: 'LIDER' },
            { usuarioId: trabajador.id, rolEnProyecto: 'MIEMBRO' },
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
        fechaInicio: new Date('2026-09-01T00:00:00Z'),
        fechaTermino: new Date('2026-09-15T00:00:00Z'),
        estado: EstadoSprint.EN_CURSO,
      },
    });
  }

  const raiz = await prisma.actividad.findFirst({
    where: { proyectoId: proyecto.id, titulo: 'Modulo de autenticacion' },
  });
  if (!raiz) {
    const padre = await prisma.actividad.create({
      data: {
        proyectoId: proyecto.id,
        sprintId: sprint.id,
        titulo: 'Modulo de autenticacion',
        descripcion: 'Agrupacion de actividades de US-01.',
        responsableId: admin.id,
        prioridad: Prioridad.ALTA,
        posicionNodo: { x: 0, y: 0 },
      },
    });

    await prisma.actividad.create({
      data: {
        proyectoId: proyecto.id,
        sprintId: sprint.id,
        actividadPadreId: padre.id,
        titulo: 'Pantalla de inicio de sesion',
        responsableId: trabajador.id,
        minutosEstimados: 240,
        posicionNodo: { x: 240, y: -80 },
        subtareas: {
          create: [
            { titulo: 'Formulario y validaciones', orden: 1 },
            { titulo: 'Manejo de errores de credenciales', orden: 2 },
          ],
        },
      },
    });

    await prisma.actividad.create({
      data: {
        proyectoId: proyecto.id,
        sprintId: sprint.id,
        actividadPadreId: padre.id,
        titulo: 'Emision y rotacion de tokens',
        responsableId: trabajador.id,
        minutosEstimados: 300,
        posicionNodo: { x: 240, y: 80 },
      },
    });
  }

  console.log('Datos iniciales listos.');
  console.log(`  admin@timeflow.cl       / ${CLAVE_DEMO}`);
  console.log(`  trabajador@timeflow.cl  / ${CLAVE_DEMO}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
