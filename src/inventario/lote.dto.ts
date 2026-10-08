import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';
import { MedicamentoResponseDto } from '../medicamentos/medicamento.dto';

export class LoteRequestDto {
  @IsString()
  @IsNotEmpty()
  medicamentoId: string;

  @IsString()
  @IsNotEmpty()
  proveedorId: string;

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
  id: string;
  medicamentoId: string;
  proveedorId: string;
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
  loteId?: string;
  mensaje: string;
}
