import { Injectable } from '@nestjs/common';
import { diasHasta } from '../common/fechas';
import { InventarioService } from './inventario.service';
import { AlertaDto, AlertaQueryDto } from './lote.dto';

const DIAS_POR_VENCER = 30;

@Injectable()
export class AlertaService {
  constructor(private readonly inventarioService: InventarioService) {}

  // Siempre 3 consultas como maximo, sin importar cuantos medicamentos haya:
  // stock agregado (2) y lotes con unidades que vencen dentro de la ventana (1)
  async generar(filtro: AlertaQueryDto = {}) {
    const dias = filtro.dias ?? DIAS_POR_VENCER;
    const incluir = (tipo: AlertaDto['tipo']) =>
      filtro.tipo === undefined || filtro.tipo === tipo;

    const { data: inventario } =
      await this.inventarioService.listarInventario();
    const alertas: AlertaDto[] = [];

    if (incluir('STOCK_BAJO')) {
      for (const item of inventario) {
        if (item.estado !== 'OK') {
          alertas.push({
            tipo: 'STOCK_BAJO',
            medicamento: item.medicamento,
            mensaje: `Quedan ${item.disponible} unidades, el minimo es ${item.medicamento.stockMinimo}`,
          });
        }
      }
    }

    if (incluir('VENCIDO') || incluir('POR_VENCER')) {
      const medicamentos = new Map(
        inventario.map((item) => [item.medicamento.id, item.medicamento]),
      );
      const lotes = await this.inventarioService.buscarLotesPorVencer(dias);

      const vencidos: AlertaDto[] = [];
      const porVencer: AlertaDto[] = [];
      for (const lote of lotes) {
        const medicamento = medicamentos.get(lote.medicamentoId);
        if (medicamento === undefined) {
          continue;
        }

        const diasRestantes = diasHasta(lote.fechaVencimiento);
        if (diasRestantes <= 0) {
          vencidos.push({
            tipo: 'VENCIDO',
            medicamento,
            mensaje: `El lote ${lote.numeroLote} esta vencido y tiene ${lote.cantidad} unidades`,
            loteId: lote.id,
            fechaVencimiento: lote.fechaVencimiento,
            diasRestantes,
          });
        } else {
          porVencer.push({
            tipo: 'POR_VENCER',
            medicamento,
            mensaje: `El lote ${lote.numeroLote} vence en ${diasRestantes} dias`,
            loteId: lote.id,
            fechaVencimiento: lote.fechaVencimiento,
            diasRestantes,
          });
        }
      }

      if (incluir('VENCIDO')) {
        alertas.push(...vencidos);
      }
      if (incluir('POR_VENCER')) {
        alertas.push(...porVencer);
      }
    }

    return {
      message: 'Alertas obtenidas correctamente',
      data: alertas,
      count: alertas.length,
    };
  }
}
