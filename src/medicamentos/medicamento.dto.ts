import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const ESPECIES = ['canino', 'felino', 'equino', 'bovino', 'general'];

export class MedicamentoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  presentacion: string;

  @IsIn(ESPECIES)
  especie: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsInt()
  @Min(0)
  stockMinimo: number;

  @IsBoolean()
  requiereFormula: boolean;
}

export class ActualizarMedicamentoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  presentacion?: string;

  @IsOptional()
  @IsIn(ESPECIES)
  especie?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsBoolean()
  requiereFormula?: boolean;
}

export class MedicamentoResponseDto extends MedicamentoDto {
  id: string;
}
