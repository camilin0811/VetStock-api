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
import { AlertaService } from './alerta.service';
import { InventarioService } from './inventario.service';
import { LoteRequestDto } from './lote.dto';
import { MovimientoQueryDto } from './movimiento.dto';
import { MovimientoService } from './movimiento.service';

@Controller()
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly alertaService: AlertaService,
    private readonly movimientoService: MovimientoService,
  ) {}

  @Post('lotes')
  registrarLote(
    @Body() datos: LoteRequestDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.inventarioService.registrarLote(datos, usuario);
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
  listarAlertas() {
    return this.alertaService.generar();
  }

  @Get('movimientos')
  listarMovimientos(@Query() filtro: MovimientoQueryDto) {
    return this.movimientoService.listar(filtro);
  }
}
