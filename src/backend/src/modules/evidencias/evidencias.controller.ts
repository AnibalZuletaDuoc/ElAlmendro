import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { EvidenciasService } from './evidencias.service';
import { ListarEvidenciasDto } from './dto/listar-evidencias.dto';
import { SubirEvidenciaDto } from './dto/subir-evidencia.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Usuario, UsuarioActual } from '../../common/usuario-actual.decorator';

@ApiTags('evidencias')
@UseGuards(JwtAuthGuard)
@Controller('evidencias')
export class EvidenciasController {
  constructor(private readonly evidencias: EvidenciasService) {}

  @Get()
  listar(@Query() dto: ListarEvidenciasDto) {
    return this.evidencias.listar(dto.actividadId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  subir(
    @Usuario() u: UsuarioActual,
    @Body() dto: SubirEvidenciaDto,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.evidencias.subir(u.id, dto.actividadId, archivo);
  }

  @Get(':id/descargar')
  async descargar(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { flujo, evidencia } = await this.evidencias.obtenerParaDescarga(id);
    res.set({
      'Content-Type': evidencia.tipoMime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(evidencia.nombreArchivo)}"`,
    });
    return new StreamableFile(flujo);
  }
}
