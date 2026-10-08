import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AlertaService } from './alerta.service';
import { InventarioService } from './inventario.service';
import { LoteRequestDto } from './lote.dto';

@Controller()
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly alertaService: AlertaService,
  ) {}

  @Post('lotes')
  registrarLote(@Body() datos: LoteRequestDto) {
    return this.inventarioService.registrarLote(datos);
  }

  @Get('lotes')
  listarLotes(@Query('medicamentoId') medicamentoId?: string) {
    return this.inventarioService.listarLotes(medicamentoId);
  }

  @Get('inventario/:medicamentoId')
  obtenerInventario(@Param('medicamentoId') medicamentoId: string) {
    return this.inventarioService.obtenerInventario(medicamentoId);
  }

  @Get('alertas')
  listarAlertas() {
    return this.alertaService.generar();
  }
}
