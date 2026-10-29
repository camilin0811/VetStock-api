import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class DispensacionRequestDto {
  @IsInt()
  @Min(1)
  medicamentoId: number;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @IsNotEmpty()
  mascota: string;

  @IsString()
  @IsNotEmpty()
  veterinario: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  formula?: string;
}

export class LoteUsadoDto {
  loteId: number;
  numeroLote: string;
  cantidad: number;
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
