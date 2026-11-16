import { Controller, Get, Query } from '@nestjs/common';
import { ConsumoQueryDto } from './reporte.dto';
import { ReporteService } from './reporte.service';

@Controller('reportes')
export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  @Get('consumo')
  consumo(@Query() filtro: ConsumoQueryDto) {
    return this.reporteService.consumo(filtro);
  }

  @Get('vencimientos')
  vencimientos() {
    return this.reporteService.vencimientos();
  }

  @Get('stock')
  async stock() {
    return {
      message: 'Reporte de stock obtenido correctamente',
      data: await this.reporteService.stock(),
    };
  }
}
