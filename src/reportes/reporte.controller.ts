import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { ConsumoQueryDto, ProveedoresQueryDto } from './reporte.dto';
import { ReporteService } from './reporte.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  /** Consumo por medicamento en un rango de fechas */
  @Get('consumo')
  consumo(@Query() filtro: ConsumoQueryDto) {
    return this.reporteService.consumo(filtro);
  }

  /** Lotes vencidos y su perdida */
  @Get('vencimientos')
  vencimientos() {
    return this.reporteService.vencimientos();
  }

  /** Stock valorizado por medicamento */
  @Get('stock')
  async stock() {
    return {
      message: 'Reporte de stock obtenido correctamente',
      data: await this.reporteService.stock(),
    };
  }

  /** Unidades y valor recibidos por proveedor */
  @Get('proveedores')
  async proveedores(@Query() filtro: ProveedoresQueryDto) {
    return {
      message: 'Reporte de proveedores obtenido correctamente',
      data: await this.reporteService.proveedores(filtro),
    };
  }

  /** Indicadores generales del inventario */
  @Get('resumen')
  async resumen() {
    return {
      message: 'Resumen obtenido correctamente',
      data: await this.reporteService.resumen(),
    };
  }
}
