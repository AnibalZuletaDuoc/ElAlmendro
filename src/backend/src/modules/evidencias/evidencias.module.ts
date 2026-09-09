import { Module } from '@nestjs/common';
import { EvidenciasController } from './evidencias.controller';
import { EvidenciasService } from './evidencias.service';
import { AlmacenamientoModule } from '../../infra/almacenamiento/almacenamiento.module';

@Module({
  imports: [AlmacenamientoModule],
  controllers: [EvidenciasController],
  providers: [EvidenciasService],
})
export class EvidenciasModule {}
