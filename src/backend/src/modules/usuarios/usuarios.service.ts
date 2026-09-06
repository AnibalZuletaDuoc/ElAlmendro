import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { obtenerPermisosDeRol, Rol, ROLES_CATALOGO } from '../../common/rbac';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UsuarioActual } from '../../common/usuario-actual.decorator';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo de roles del sistema con sus descripciones y permisos asignados. */
  listarRoles() {
    return ROLES_CATALOGO;
  }

  /**
   * Lista todos los usuarios con soporte de filtros por rol, estado y búsqueda por nombre o correo.
   */
  async listarTodos(filtros?: { rol?: Rol; activo?: boolean; busqueda?: string }) {
    const where: any = {};

    if (filtros?.rol) {
      where.rol = filtros.rol;
    }

    if (filtros?.activo !== undefined) {
      where.activo = filtros.activo;
    }

    if (filtros?.busqueda?.trim()) {
      const q = filtros.busqueda.trim();
      where.OR = [
        { nombreCompleto: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const usuarios = await this.prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        rol: true,
        zonaHoraria: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
        _count: {
          select: {
            sesiones: true,
            jornadas: true,
            actividades: true,
          },
        },
      },
      orderBy: [{ activo: 'desc' }, { nombreCompleto: 'asc' }],
    });

    return usuarios.map((u) => ({
      ...u,
      permisos: obtenerPermisosDeRol(u.rol),
    }));
  }

  /** Obtiene el detalle de un usuario por su ID. */
  async detalle(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        rol: true,
        zonaHoraria: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario no existe.');
    }

    return {
      ...usuario,
      permisos: obtenerPermisosDeRol(usuario.rol),
    };
  }

  /**
   * Crea un nuevo usuario en el sistema con su contraseña hasheada en Argon2id
   * y registra el evento en la auditoría inmutable.
   */
  async crear(actor: UsuarioActual, dto: CrearUsuarioDto) {
    if (actor.rol === 'SUPERVISOR' && dto.rol !== 'TRABAJADOR') {
      throw new ForbiddenException(
        'Un supervisor solo tiene autorización para dar de alta trabajadores a su cargo.',
      );
    }

    const email = dto.email.toLowerCase().trim();

    const existente = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existente) {
      throw new ConflictException(`Ya existe un usuario registrado con el correo ${email}.`);
    }

    const hashContrasena = await argon2.hash(dto.contrasena);

    const usuario = await this.prisma.$transaction(async (tx) => {
      const nuevo = await tx.usuario.create({
        data: {
          email,
          nombreCompleto: dto.nombreCompleto.trim(),
          hashContrasena,
          rol: dto.rol as any,
          zonaHoraria: dto.zonaHoraria || 'America/Santiago',
          activo: true,
        },
        select: {
          id: true,
          email: true,
          nombreCompleto: true,
          rol: true,
          zonaHoraria: true,
          activo: true,
          creadoEn: true,
        },
      });

      await tx.registroAuditoria.create({
        data: {
          actorId: actor.id,
          accion: 'USUARIO_CREADO',
          tipoEntidad: 'Usuario',
          entidadId: nuevo.id,
          valorNuevo: {
            email: nuevo.email,
            nombreCompleto: nuevo.nombreCompleto,
            rol: nuevo.rol,
          },
        },
      });

      return nuevo;
    });

    return {
      ...usuario,
      permisos: obtenerPermisosDeRol(usuario.rol),
    };
  }

  /**
   * Actualiza los datos de un usuario existente. Si se incluye contraseña,
   * se hashea nuevamente. Protege contra despojar al único administrador activo.
   */
  async actualizar(actor: UsuarioActual, id: string, dto: ActualizarUsuarioDto) {
    const existente = await this.prisma.usuario.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException('El usuario a actualizar no existe.');
    }

    // Regla de salvaguarda: supervisor solo gestiona trabajadores a su cargo
    if (actor.rol === 'SUPERVISOR') {
      if (existente.rol !== 'TRABAJADOR') {
        throw new ForbiddenException(
          'Un supervisor solo tiene autorización para gestionar trabajadores a su cargo.',
        );
      }
      if (dto.rol && dto.rol !== 'TRABAJADOR') {
        throw new ForbiddenException(
          'Un supervisor no puede promover cuentas a supervisor o administrador.',
        );
      }
    }

    // Regla de salvaguarda: no permitir desactivar o quitar rol al último administrador activo
    const cambiaraAdmin =
      existente.rol === 'ADMINISTRADOR' &&
      ((dto.activo === false && existente.activo) ||
        (dto.rol && dto.rol !== 'ADMINISTRADOR'));

    if (cambiaraAdmin) {
      const otrosAdmins = await this.prisma.usuario.count({
        where: {
          rol: 'ADMINISTRADOR',
          activo: true,
          id: { not: id },
        },
      });

      if (otrosAdmins === 0) {
        throw new BadRequestException(
          'No es posible degradar o desactivar al único administrador activo del sistema.',
        );
      }
    }

    const data: any = {};

    if (dto.email?.trim()) {
      const nuevoEmail = dto.email.toLowerCase().trim();
      if (nuevoEmail !== existente.email) {
        const enUso = await this.prisma.usuario.findUnique({
          where: { email: nuevoEmail },
        });
        if (enUso) {
          throw new ConflictException(
            `Ya existe un usuario registrado con el correo ${nuevoEmail}.`,
          );
        }
        data.email = nuevoEmail;
      }
    }

    if (dto.nombreCompleto?.trim()) {
      data.nombreCompleto = dto.nombreCompleto.trim();
    }

    if (dto.rol) {
      data.rol = dto.rol as any;
    }

    if (dto.activo !== undefined) {
      data.activo = dto.activo;
    }

    if (dto.zonaHoraria?.trim()) {
      data.zonaHoraria = dto.zonaHoraria.trim();
    }

    if (dto.contrasena && dto.contrasena.trim().length >= 8) {
      data.hashContrasena = await argon2.hash(dto.contrasena.trim());
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const u = await tx.usuario.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          nombreCompleto: true,
          rol: true,
          zonaHoraria: true,
          activo: true,
          actualizadoEn: true,
        },
      });

      await tx.registroAuditoria.create({
        data: {
          actorId: actor.id,
          accion: 'USUARIO_ACTUALIZADO',
          tipoEntidad: 'Usuario',
          entidadId: u.id,
          valorAnterior: {
            email: existente.email,
            rol: existente.rol,
            activo: existente.activo,
            nombreCompleto: existente.nombreCompleto,
          },
          valorNuevo: {
            email: u.email,
            rol: u.rol,
            activo: u.activo,
            nombreCompleto: u.nombreCompleto,
          },
        },
      });

      return u;
    });

    return {
      ...actualizado,
      permisos: obtenerPermisosDeRol(actualizado.rol),
    };
  }

  /**
   * Desactiva un usuario (Soft Delete).
   * Impide que un usuario se desactive a sí mismo o al último administrador,
   * y que un supervisor desactive administradores.
   */
  async desactivar(actor: UsuarioActual, id: string) {
    if (actor.id === id) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta.');
    }

    const existente = await this.prisma.usuario.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException('El usuario no existe.');
    }

    if (actor.rol === 'SUPERVISOR') {
      if (existente.rol !== 'TRABAJADOR') {
        throw new ForbiddenException(
          'Un supervisor no tiene permisos para desactivar administradores ni otros supervisores.',
        );
      }
    }

    if (!existente.activo) {
      return { ok: true, mensaje: 'El usuario ya se encuentra inactivo.', id };
    }

    if (existente.rol === 'ADMINISTRADOR') {
      const otrosAdmins = await this.prisma.usuario.count({
        where: {
          rol: 'ADMINISTRADOR',
          activo: true,
          id: { not: id },
        },
      });

      if (otrosAdmins === 0) {
        throw new BadRequestException(
          'No puedes desactivar al único administrador activo del sistema.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id },
        data: { activo: false },
      });

      await tx.registroAuditoria.create({
        data: {
          actorId: actor.id,
          accion: 'USUARIO_DESACTIVADO',
          tipoEntidad: 'Usuario',
          entidadId: id,
          valorAnterior: { activo: true },
          valorNuevo: { activo: false },
        },
      });
    });

    return { ok: true, id };
  }

  /** Trabajadores activos, para poblar el selector del calendario y los reportes. */
  async trabajadores(soloId?: string) {
    const filas = await this.prisma.usuario.findMany({
      where: {
        rol: { in: ['TRABAJADOR', 'SUPERVISOR'] as any },
        activo: true,
        ...(soloId ? { id: soloId } : {}),
      },
      select: { id: true, nombreCompleto: true },
      orderBy: { nombreCompleto: 'asc' },
    });
    return filas.map((f) => ({ id: f.id, nombre: f.nombreCompleto }));
  }
}
