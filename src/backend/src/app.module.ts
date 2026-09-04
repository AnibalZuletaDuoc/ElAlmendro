import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './infra/prisma/prisma.module';
import { SaludController } from './common/salud.controller';

/**
 * Raiz de la capa de negocio.
 *
 * Cada modulo de la seccion 4.3 del documento de arquitectura se agrega aqui a
 * medida que se implementa. Norma del equipo: ningun modulo importa el
 * repositorio de otro; se habla por servicios publicos o por eventos.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    // AuthModule, UsuariosModule, JornadaModule, ActividadesModule,
    // SesionesModule, NodosModule, EvidenciasModule, ReportesModule,
    // HistorialModule, DashboardModule, NotificacionesModule,
  ],
  controllers: [SaludController],
})
export class AppModule {}
