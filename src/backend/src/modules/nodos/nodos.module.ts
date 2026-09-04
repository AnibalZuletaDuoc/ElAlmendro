import { Module } from '@nestjs/common';
import { NodosController } from './nodos.controller';
import { NodosService } from './nodos.service';

@Module({
  controllers: [NodosController],
  providers: [NodosService],
  exports: [NodosService],
})
export class NodosModule {}
