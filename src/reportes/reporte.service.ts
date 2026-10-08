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

  consumo(filtro: ConsumoQueryDto): ReporteConsumoDto {
    const desde = filtro.desde?.slice(0, 10) ?? diasDesdeHoy(-30);
    const hasta = filtro.hasta?.slice(0, 10) ?? hoy();
    if (desde > hasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta',
      );
    }

    const detalle = new Map<string, ConsumoMedicamentoDto>();
    for (const dispensacion of this.dispensacionService.listar()) {
      if (dispensacion.fecha < desde || dispensacion.fecha > hasta) {
        continue;
      }

      const consumo = detalle.get(dispensacion.medicamentoId) ?? {
        medicamento: this.medicamentoService.obtener(
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

  vencimientos(): ReporteVencimientosDto {
    const lotes = this.inventarioService
      .listarLotes()
      .filter(
        (lote) => lote.cantidad > 0 && this.inventarioService.vencido(lote),
      )
      .map((lote) => {
        const medicamento = this.medicamentoService.obtener(lote.medicamentoId);
        return {
          lote,
          medicamento,
          perdida: lote.cantidad * medicamento.precio,
        };
      });

    return {
      totalPerdida: lotes.reduce((total, lote) => total + lote.perdida, 0),
      lotes,
    };
  }
}
