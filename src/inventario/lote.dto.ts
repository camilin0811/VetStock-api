import { PartialType, PickType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
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

// Correccion de datos: no cambia medicamento ni cantidades (para eso estan los ajustes)
export class ActualizarLoteDto extends PartialType(
  PickType(LoteRequestDto, ['proveedorId', 'numeroLote', 'fechaVencimiento']),
) {}

export const MOTIVOS_AJUSTE = ['PERDIDA', 'DANO', 'VENCIDO', 'OTRO'] as const;
export type MotivoAjuste = (typeof MOTIVOS_AJUSTE)[number];

export class AjusteDto {
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsIn(MOTIVOS_AJUSTE)
  motivo: MotivoAjuste;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  observacion?: string;
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

export type EstadoStock = 'OK' | 'STOCK_BAJO' | 'SIN_STOCK';

export class InventarioItemDto {
  medicamento: MedicamentoResponseDto;
  disponible: number;
  vencido: number;
  estado: EstadoStock;
}

export class AlertaDto {
  tipo: 'STOCK_BAJO' | 'POR_VENCER' | 'VENCIDO';
  medicamento: MedicamentoResponseDto;
  loteId?: number;
  mensaje: string;
}
