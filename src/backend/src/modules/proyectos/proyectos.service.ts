import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CrearProyectoDto } from './dto/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto';

/**
 * Proyectos: la unidad que agrupa las tareas de un trabajador. Cada proyecto
 * es la raiz del mapa de nodos correspondiente (US-05).
 */
@Injectable()
export class ProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Proyectos donde el usuario es propietario o miembro. */
  async mios(usuarioId: string) {
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        OR: [{ propietarioId: usuarioId }, { miembros: { some: { usuarioId } } }],
      },
      orderBy: { creadoEn: 'asc' },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        estado: true,
        creadoEn: true,
        _count: {
          select: { actividades: { where: { eliminadoEn: null } } },
        },
      },
    });

    return proyectos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      estado: p.estado,
      creadoEn: p.creadoEn,
      totalTareas: p._count.actividades,
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

    return { ...proyecto, totalTareas: 0 };
  }

  async actualizar(id: string, usuarioId: string, dto: ActualizarProyectoDto) {
    const proyecto = await this.prisma.proyecto.findFirst({
      where: {
        id,
        OR: [{ propietarioId: usuarioId }, { miembros: { some: { usuarioId } } }],
      },
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
      },
    });

    return {
      id: actualizado.id,
      nombre: actualizado.nombre,
      descripcion: actualizado.descripcion,
      estado: actualizado.estado,
      creadoEn: actualizado.creadoEn,
      totalTareas: actualizado._count.actividades,
    };
  }
}
