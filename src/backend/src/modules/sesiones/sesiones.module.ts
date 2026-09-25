import { Module } from '@nestjs/common';
import { SesionesController } from './sesiones.controller';
import { SesionesService } from './sesiones.service';
import { ActividadesModule } from '../actividades/actividades.module';

@Module({
  // Cerrar una sesion como completada exige que la tarea tenga evidencia:
  // esa regla vive en el modulo de actividades.
  imports: [ActividadesModule],
  controllers: [SesionesController],
  providers: [SesionesService],
  exports: [SesionesService],
})
export class SesionesModule {}
