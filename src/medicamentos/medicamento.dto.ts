import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ESPECIES = ['canino', 'felino', 'equino', 'bovino', 'general'];

export class MedicamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  presentacion: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imagen?: string | null;

  @IsIn(ESPECIES)
  especie: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  precio: number;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  stockMinimo: number;

  @IsBoolean()
  requiereFormula: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  categoriaIds?: number[];
}

export class MedicamentoQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(ESPECIES)
  especie?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoriaId?: number;
}

export class ActualizarMedicamentoDto extends PartialType(MedicamentoDto) {}

export class MedicamentoResponseDto extends MedicamentoDto {
  id: number;
}
