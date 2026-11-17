import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Inventario')
@ApiBearerAuth()
@Controller()
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly alertaService: AlertaService,
    private readonly movimientoService: MovimientoService,
  ) {}

  /** Registra un lote y su movimiento ENTRADA */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post('lotes')
  registrarLote(
    @Body() datos: LoteRequestDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.inventarioService.registrarLote(datos, usuario);
  }

  /** Reemplaza los datos corregibles de un lote (proveedor, numero y vencimiento) */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put('lotes/:id')
  reemplazarLote(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ReemplazarLoteDto,
  ) {
    return this.inventarioService.actualizarLote(id, datos);
  }

  /** Corrige parcialmente un lote (no cambia cantidades) */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch('lotes/:id')
  actualizarLote(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarLoteDto,
  ) {
    return this.inventarioService.actualizarLote(id, datos);
  }

  /** Ajusta el stock de un lote por perdida, dano, vencimiento u otro motivo */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post('lotes/:id/ajustes')
  ajustarLote(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: AjusteDto,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.inventarioService.ajustarLote(id, datos, usuario);
  }

  /** Lista los lotes, opcionalmente por medicamento */
  @Get('lotes')
  listarLotes(
    @Query('medicamentoId', new ParseIntPipe({ optional: true }))
    medicamentoId?: number,
  ) {
    return this.inventarioService.listarLotes(medicamentoId);
  }

  /** Stock disponible y vencido por medicamento */
  @Get('inventario')
  listarInventario() {
    return this.inventarioService.listarInventario();
  }

  /** Stock y lotes de un medicamento */
  @Get('inventario/:medicamentoId')
  obtenerInventario(
    @Param('medicamentoId', ParseIntPipe) medicamentoId: number,
  ) {
    return this.inventarioService.obtenerInventario(medicamentoId);
  }

  /** Alertas de stock bajo, por vencer y vencidos */
  @Get('alertas')
  listarAlertas(@Query() filtro: AlertaQueryDto) {
    return this.alertaService.generar(filtro);
  }

  /** Kardex de movimientos de stock */
  @Get('movimientos')
  listarMovimientos(@Query() filtro: MovimientoQueryDto) {
    return this.movimientoService.listar(filtro);
  }
}
