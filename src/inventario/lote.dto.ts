import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';
import { MedicamentoResponseDto } from '../medicamentos/medicamento.dto';

export class LoteRequestDto {
  @IsInt()
  @Min(1)
  medicamentoId: number;

  @IsInt()
  @Min(1)
  proveedorId: number;

  @IsString()
  @IsNotEmpty()
  numeroLote: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsDateString()
  fechaVencimiento: string;
}

export class LoteDto {
  id: number;
  medicamentoId: number;
  proveedorId: number;
  numeroLote: string;
  cantidadInicial: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string;
}

export class InventarioDto {
  medicamento: MedicamentoResponseDto;
  stockDisponible: number;
  stockVencido: number;
  lotes: LoteDto[];
}

export class AlertaDto {
  tipo: 'STOCK_BAJO' | 'POR_VENCER' | 'VENCIDO';
  medicamento: MedicamentoResponseDto;
  loteId?: number;
  mensaje: string;
}
