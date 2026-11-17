import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class DispensacionRequestDto {
  @IsInt()
  @Min(1)
  medicamentoId: number;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mascota: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  veterinario: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  formula?: string;
}

export class DispensacionQueryDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medicamentoId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mascota?: string;
}

export class AnularDispensacionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;
}

export type EstadoDispensacion = 'ACTIVA' | 'ANULADA';

export class LoteUsadoDto {
  loteId: number;
  numeroLote: string;
  cantidad: number;
  // Ausente en dispensaciones registradas antes de guardar este dato
  fechaVencimiento?: string;
}

export class DispensacionDto {
  id: number;
  medicamentoId: number;
  cantidad: number;
  mascota: string;
  veterinario: string;
  formula?: string;
  fecha: string;
  total: number;
  lotesUsados: LoteUsadoDto[];
}
