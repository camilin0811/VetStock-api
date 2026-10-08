import { Injectable } from '@nestjs/common';
import { diasHasta } from '../common/fechas';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { InventarioService } from './inventario.service';
import { AlertaDto } from './lote.dto';

const DIAS_POR_VENCER = 30;

@Injectable()
export class AlertaService {
  constructor(
    private readonly medicamentoService: MedicamentoService,
    private readonly inventarioService: InventarioService,
  ) {}

  generar(): AlertaDto[] {
    const alertas: AlertaDto[] = [];

    for (const medicamento of this.medicamentoService.listar()) {
      const inventario = this.inventarioService.obtenerInventario(
        medicamento.id,
      );

      if (inventario.stockDisponible < medicamento.stockMinimo) {
        alertas.push({
          tipo: 'STOCK_BAJO',
          medicamento,
          mensaje: `Quedan ${inventario.stockDisponible} unidades, el minimo es ${medicamento.stockMinimo}`,
        });
      }

      for (const lote of inventario.lotes) {
        if (lote.cantidad === 0) {
          continue;
        }

        const dias = diasHasta(lote.fechaVencimiento);
        if (dias <= 0) {
          alertas.push({
            tipo: 'VENCIDO',
            medicamento,
            loteId: lote.id,
            mensaje: `El lote ${lote.numeroLote} esta vencido y tiene ${lote.cantidad} unidades`,
          });
        } else if (dias <= DIAS_POR_VENCER) {
          alertas.push({
            tipo: 'POR_VENCER',
            medicamento,
            loteId: lote.id,
            mensaje: `El lote ${lote.numeroLote} vence en ${dias} dias`,
          });
        }
      }
    }

    return alertas;
  }
}
