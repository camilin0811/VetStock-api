import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import type { Usuario } from '../auth/entities/usuario.entity';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import {
  AnularDispensacionDto,
  DispensacionQueryDto,
  DispensacionRequestDto,
} from './dispensacion.dto';
import { DispensacionService } from './dispensacion.service';

@ApiTags('Dispensaciones')
@ApiBearerAuth()
@Controller('dispensaciones')
export class DispensacionController {
  constructor(private readonly dispensacionService: DispensacionService) {}

  /** Dispensa un medicamento descontando por FEFO */
  @Post()
  dispensar(
    @Body() datos: DispensacionRequestDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.dispensacionService.dispensar(datos, usuario);
  }

  /** Lista las dispensaciones con filtros */
  @Get()
  listar(@Query() filtro: DispensacionQueryDto) {
    return this.dispensacionService.listar(filtro);
  }

  /** Obtiene una dispensacion con los lotes usados */
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.dispensacionService.obtener(id);
  }

  /** Anula una dispensacion y devuelve el stock a sus lotes */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @HttpCode(200)
  @Post(':id/anular')
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: AnularDispensacionDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.dispensacionService.anular(id, datos.motivo, usuario);
  }
}
