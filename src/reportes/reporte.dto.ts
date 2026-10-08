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
