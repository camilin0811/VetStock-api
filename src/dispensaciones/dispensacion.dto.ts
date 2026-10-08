import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class DispensacionRequestDto {
  @IsString()
  @IsNotEmpty()
  medicamentoId: string;

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
  loteId: string;
  numeroLote: string;
  cantidad: number;
}

export class DispensacionDto {
  id: string;
  medicamentoId: string;
  cantidad: number;
  mascota: string;
  veterinario: string;
  formula?: string;
  fecha: string;
  total: number;
  lotesUsados: LoteUsadoDto[];
}
