import { IsDateString, IsOptional } from 'class-validator';
import { LoteDto } from '../inventario/lote.dto';
import { MedicamentoResponseDto } from '../medicamentos/medicamento.dto';

export class ConsumoQueryDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}

export class ConsumoMedicamentoDto {
  medicamento: MedicamentoResponseDto;
  unidades: number;
  total: number;
}

export class ReporteConsumoDto {
  desde: string;
  hasta: string;
  totalUnidades: number;
  totalVentas: number;
  detalle: ConsumoMedicamentoDto[];
}

export class LoteVencidoDto {
  lote: LoteDto;
  medicamento: MedicamentoResponseDto;
  perdida: number;
}

export class ReporteVencimientosDto {
  totalPerdida: number;
  lotes: LoteVencidoDto[];
}

export class ProveedoresQueryDto extends ConsumoQueryDto {}

export class StockMedicamentoDto {
  medicamento: { id: number; nombre: string };
  unidades: number;
  valor: number;
}

export class ReporteStockDto {
  items: StockMedicamentoDto[];
  valorTotal: number;
}

export class ProveedorRecibidoDto {
  proveedor: { id: number; nombre: string };
  lotes: number;
  unidades: number;
  valor: number;
}

export class ConsumoDiarioDto {
  fecha: string;
  unidades: number;
}

export class ProximoVencimientoDto {
  loteId: number;
  numeroLote: string;
  medicamento: { id: number; nombre: string };
  fechaVencimiento: string;
  diasRestantes: number;
  cantidad: number;
}

export class ResumenDto {
  totalMedicamentos: number;
  unidadesDisponibles: number;
  valorInventario: number;
  stockBajo: number;
  porVencer: number;
  vencidos: number;
  dispensacionesHoy: number;
  dispensacionesSemana: number;
  porcentajeStockSaludable: number;
  consumoUltimos7Dias: ConsumoDiarioDto[];
  proximosVencimientos: ProximoVencimientoDto[];
  ultimasDispensaciones: unknown[];
}
