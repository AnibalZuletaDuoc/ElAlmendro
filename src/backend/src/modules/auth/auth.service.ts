import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Verifica las credenciales y emite el token de acceso.
   *
   * El mensaje de error es identico para correo inexistente y contrasena
   * incorrecta: distinguirlos permitiria averiguar que correos estan
   * registrados en el sistema.
   */
  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    const generico = new UnauthorizedException('Correo o contrasena incorrectos.');
    if (!usuario || !usuario.activo) throw generico;

    const valida = await argon2.verify(usuario.hashContrasena, dto.contrasena);
    if (!valida) throw generico;

    const token = await this.jwt.signAsync(
      {
        sub: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombreCompleto,
      },
      {
        secret: process.env.JWT_ACCESO_SECRET ?? process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESO_TTL ??
          process.env.JWT_ACCESS_TTL ??
          '8h') as SignOptions['expiresIn'],
      },
    );

    await this.prisma.registroAuditoria.create({
      data: {
        actorId: usuario.id,
        // Distinto de SESION_INICIADA, que corresponde al inicio de una
        // sesion de trabajo cronometrada.
        accion: 'INICIO_SESION',
        tipoEntidad: 'Usuario',
        entidadId: usuario.id,
      },
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
      },
    };
  }
}
