import { BadRequestException, Injectable } from '@nestjs/common';
import { diasDesdeHoy, hoy } from '../common/fechas';
import { DispensacionService } from '../dispensaciones/dispensacion.service';
import { InventarioService } from '../inventario/inventario.service';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import {
  ConsumoMedicamentoDto,
  ConsumoQueryDto,
  ReporteConsumoDto,
  ReporteVencimientosDto,
} from './reporte.dto';

@Injectable()
export class ReporteService {
  constructor(
    private readonly dispensacionService: DispensacionService,
    private readonly inventarioService: InventarioService,
    private readonly medicamentoService: MedicamentoService,
  ) {}

  async consumo(filtro: ConsumoQueryDto): Promise<ReporteConsumoDto> {
    const desde = filtro.desde?.slice(0, 10) ?? diasDesdeHoy(-30);
    const hasta = filtro.hasta?.slice(0, 10) ?? hoy();
    if (desde > hasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta',
      );
    }

    const detalle = new Map<number, ConsumoMedicamentoDto>();
    for (const dispensacion of await this.dispensacionService.listar()) {
      if (dispensacion.fecha < desde || dispensacion.fecha > hasta) {
        continue;
      }

      const consumo = detalle.get(dispensacion.medicamentoId) ?? {
        medicamento: await this.medicamentoService.obtener(
          dispensacion.medicamentoId,
        ),
        unidades: 0,
        total: 0,
      };
      consumo.unidades += dispensacion.cantidad;
      consumo.total += dispensacion.total;
      detalle.set(dispensacion.medicamentoId, consumo);
    }

    const consumos = [...detalle.values()].sort(
      (a, b) => b.unidades - a.unidades,
    );

    return {
      desde,
      hasta,
      totalUnidades: consumos.reduce((total, c) => total + c.unidades, 0),
      totalVentas: consumos.reduce((total, c) => total + c.total, 0),
      detalle: consumos,
    };
  }

  async vencimientos(): Promise<ReporteVencimientosDto> {
    const lotes = (await this.inventarioService.listarLotes())
      .filter(
        (lote) => lote.cantidad > 0 && this.inventarioService.vencido(lote),
      )
      .map(async (lote) => {
        const medicamento = await this.medicamentoService.obtener(
          lote.medicamentoId,
        );
        return {
          lote,
          medicamento,
          perdida: lote.cantidad * medicamento.precio,
        };
      });

    const vencidos = await Promise.all(lotes);

    return {
      totalPerdida: vencidos.reduce((total, lote) => total + lote.perdida, 0),
      lotes: vencidos,
    };
  }
}
