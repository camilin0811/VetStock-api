import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { Usuario } from '../auth/entities/usuario.entity';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { AlertaService } from './alerta.service';
import { InventarioService } from './inventario.service';
import {
  ActualizarLoteDto,
  AjusteDto,
  AlertaQueryDto,
  LoteRequestDto,
  ReemplazarLoteDto,
} from './lote.dto';
import { MovimientoQueryDto } from './movimiento.dto';
import { MovimientoService } from './movimiento.service';

@Controller()
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly alertaService: AlertaService,
    private readonly movimientoService: MovimientoService,
  ) {}

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post('lotes')
  registrarLote(
    @Body() datos: LoteRequestDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.inventarioService.registrarLote(datos, usuario);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put('lotes/:id')
  reemplazarLote(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ReemplazarLoteDto,
  ) {
    return this.inventarioService.actualizarLote(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch('lotes/:id')
  actualizarLote(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarLoteDto,
  ) {
    return this.inventarioService.actualizarLote(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post('lotes/:id/ajustes')
  ajustarLote(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: AjusteDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.inventarioService.ajustarLote(id, datos, usuario);
  }

  @Get('lotes')
  listarLotes(
    @Query('medicamentoId', new ParseIntPipe({ optional: true }))
    medicamentoId?: number,
  ) {
    return this.inventarioService.listarLotes(medicamentoId);
  }

  @Get('inventario')
  listarInventario() {
    return this.inventarioService.listarInventario();
  }

  @Get('inventario/:medicamentoId')
  obtenerInventario(
    @Param('medicamentoId', ParseIntPipe) medicamentoId: number,
  ) {
    return this.inventarioService.obtenerInventario(medicamentoId);
  }

  @Get('alertas')
  listarAlertas(@Query() filtro: AlertaQueryDto) {
    return this.alertaService.generar(filtro);
  }

  @Get('movimientos')
  listarMovimientos(@Query() filtro: MovimientoQueryDto) {
    return this.movimientoService.listar(filtro);
  }
}
