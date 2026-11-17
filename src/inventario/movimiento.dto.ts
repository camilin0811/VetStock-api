import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import {
  type TipoMovimiento,
  TIPOS_MOVIMIENTO,
} from './entities/movimiento.entity';
import { MedicamentoResponseDto } from '../medicamentos/medicamento.dto';

export class MovimientoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medicamentoId?: number;

  @IsOptional()
  @IsIn(TIPOS_MOVIMIENTO)
  tipo?: TipoMovimiento;
}

export class MovimientoDto {
  id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  loteId: number;
  medicamentoId: number;
  medicamento: MedicamentoResponseDto;
  numeroLote: string;
  detalle: string | null;
  usuario: { id: number; nombre: string } | null;
  fecha: Date;
}
