import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { COOKIE_ACCESO, JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** US-01 — inicia sesion y deja el token en una cookie httpOnly. */
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, usuario } = await this.auth.login(dto);

    res.cookie(COOKIE_ACCESO, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    return usuario;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_ACCESO, { path: '/' });
    return { ok: true };
  }

  /** Devuelve el usuario de la sesion vigente. */
  @UseGuards(JwtAuthGuard)
  @Get('yo')
  yo(@Usuario() usuario: UsuarioActual) {
    return usuario;
  }
}
