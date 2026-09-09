import { Module } from '@nestjs/common';
import { AlmacenamientoService } from './almacenamiento.service';

@Module({
  providers: [AlmacenamientoService],
  exports: [AlmacenamientoService],
})
export class AlmacenamientoModule {}
