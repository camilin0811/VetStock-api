import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { Usuario } from '../auth/entities/usuario.entity';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import {
  DispensacionQueryDto,
  DispensacionRequestDto,
} from './dispensacion.dto';
import { DispensacionService } from './dispensacion.service';

@Controller('dispensaciones')
export class DispensacionController {
  constructor(private readonly dispensacionService: DispensacionService) {}

  @Post()
  dispensar(
    @Body() datos: DispensacionRequestDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.dispensacionService.dispensar(datos, usuario);
  }

  @Get()
  listar(@Query() filtro: DispensacionQueryDto) {
    return this.dispensacionService.listar(filtro);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.dispensacionService.obtener(id);
  }
}
