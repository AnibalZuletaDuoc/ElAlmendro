import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CrearProyectoDto } from './dto/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto';
import { UsuarioActual } from '../../common/usuario-actual.decorator';

/**
 * Proyectos: la unidad que agrupa las tareas de un trabajador. Cada proyecto
 * es la raiz del mapa de nodos correspondiente (US-05).
 */
@Injectable()
export class ProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Proyectos del trabajador de la sesion (propios, miembros o donde tiene tareas asignadas; o todos para admin). */
  async mios(u: UsuarioActual) {
    const esAdmin = u.rol === 'ADMINISTRADOR';
    const proyectos = await this.prisma.proyecto.findMany({
      where: esAdmin
        ? {}
        : {
            OR: [
              { propietarioId: u.id },
              { miembros: { some: { usuarioId: u.id } } },
              { actividades: { some: { responsableId: u.id, eliminadoEn: null } } },
            ],
          },
      orderBy: { creadoEn: 'asc' },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        estado: true,
        creadoEn: true,
        actividades: {
          where: { eliminadoEn: null },
          select: { estado: true },
        },
      },
    });

    // El cofre se llena con las tareas ya guardadas: por eso ademas del total
    // viaja cuantas estan completadas.
    return proyectos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      estado: p.estado,
      creadoEn: p.creadoEn,
      totalTareas: p.actividades.length,
      tareasCompletadas: p.actividades.filter((a) => a.estado === 'COMPLETADA').length,
    }));
  }

  async crear(usuarioId: string, dto: CrearProyectoDto) {
    const proyecto = await this.prisma.proyecto.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        propietarioId: usuarioId,
        miembros: {
          create: { usuarioId, rolEnProyecto: 'LIDER' },
        },
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        estado: true,
        creadoEn: true,
      },
    });

    return { ...proyecto, totalTareas: 0, tareasCompletadas: 0 };
  }

  async actualizar(id: string, u: UsuarioActual, dto: ActualizarProyectoDto) {
    // Cualquier rol puede crear proyectos, pero modificarlos queda reservado a
    // administrador y supervisor: un trabajador que abrio un proyecto es su
    // propietario y aun asi no debe poder cambiarlo.
    if (u.rol === 'TRABAJADOR') {
      throw new ForbiddenException('Solo un administrador o supervisor puede modificar proyectos.');
    }
    const proyecto = await this.prisma.proyecto.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!proyecto) throw new NotFoundException('El proyecto no existe.');

    const actualizado = await this.prisma.proyecto.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        estado: true,
        creadoEn: true,
        _count: {
          select: { actividades: { where: { eliminadoEn: null } } },
        },
        actividades: {
          where: { eliminadoEn: null },
          select: { estado: true },
        },
      },
    });

    return {
      id: actualizado.id,
      nombre: actualizado.nombre,
      descripcion: actualizado.descripcion,
      estado: actualizado.estado,
      creadoEn: actualizado.creadoEn,
      totalTareas: actualizado._count.actividades,
      tareasCompletadas: actualizado.actividades.filter((a) => a.estado === 'COMPLETADA').length,
    };
  }

  /**
   * Equipo del proyecto. Lo ve cualquiera que pueda ver el proyecto: admin y
   * supervisor siempre; el resto solo si es miembro o tiene tareas en el.
   */
  async miembros(id: string, u: UsuarioActual) {
    const puedeVerTodo = u.rol !== 'TRABAJADOR';
    const proyecto = await this.prisma.proyecto.findFirst({
      where: {
        id,
        ...(puedeVerTodo
          ? {}
          : {
              OR: [
                { propietarioId: u.id },
                { miembros: { some: { usuarioId: u.id } } },
                { actividades: { some: { responsableId: u.id, eliminadoEn: null } } },
              ],
            }),
      },
      select: { id: true },
    });
    if (!proyecto) throw new NotFoundException('El proyecto no existe.');
    return this.listarMiembros(id);
  }

  private async listarMiembros(proyectoId: string) {
    const filas = await this.prisma.miembroProyecto.findMany({
      where: { proyectoId },
      orderBy: { agregadoEn: 'asc' },
      select: {
        rolEnProyecto: true,
        agregadoEn: true,
        usuario: { select: { id: true, nombreCompleto: true, rol: true, activo: true } },
      },
    });
    return filas.map((m) => ({
      id: m.usuario.id,
      nombre: m.usuario.nombreCompleto,
      rol: m.usuario.rol,
      activo: m.usuario.activo,
      rolEnProyecto: m.rolEnProyecto,
      agregadoEn: m.agregadoEn,
    }));
  }

  /**
   * Asignar una persona al proyecto: con eso le aparece en "Mis proyectos".
   * Idempotente: agregar a quien ya es miembro no falla ni duplica.
   */
  async agregarMiembro(id: string, actorId: string, usuarioId: string) {
    const [proyecto, usuario] = await Promise.all([
      this.prisma.proyecto.findUnique({ where: { id }, select: { id: true } }),
      this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, activo: true },
      }),
    ]);
    if (!proyecto) throw new NotFoundException('El proyecto no existe.');
    if (!usuario) throw new NotFoundException('El usuario no existe.');
    if (!usuario.activo) throw new BadRequestException('El usuario esta desactivado.');

    await this.prisma.$transaction(async (tx) => {
      const existente = await tx.miembroProyecto.findUnique({
        where: { proyectoId_usuarioId: { proyectoId: id, usuarioId } },
        select: { usuarioId: true },
      });
      if (existente) return;
      await tx.miembroProyecto.create({ data: { proyectoId: id, usuarioId } });
      await tx.registroAuditoria.create({
        data: {
          actorId,
          accion: 'PROYECTO_MIEMBRO_AGREGADO',
          tipoEntidad: 'Proyecto',
          entidadId: id,
          valorNuevo: { usuarioId },
        },
      });
    });

    return this.listarMiembros(id);
  }

  /** Quitar a alguien del equipo. Sus tareas siguen a su nombre: eso se resuelve reasignando. */
  async quitarMiembro(id: string, actorId: string, usuarioId: string) {
    const miembro = await this.prisma.miembroProyecto.findUnique({
      where: { proyectoId_usuarioId: { proyectoId: id, usuarioId } },
      select: { rolEnProyecto: true },
    });
    if (!miembro) throw new NotFoundException('Esa persona no es miembro del proyecto.');

    await this.prisma.$transaction([
      this.prisma.miembroProyecto.delete({
        where: { proyectoId_usuarioId: { proyectoId: id, usuarioId } },
      }),
      this.prisma.registroAuditoria.create({
        data: {
          actorId,
          accion: 'PROYECTO_MIEMBRO_QUITADO',
          tipoEntidad: 'Proyecto',
          entidadId: id,
          valorAnterior: { usuarioId, rolEnProyecto: miembro.rolEnProyecto },
        },
      }),
    ]);

    return this.listarMiembros(id);
  }
}
