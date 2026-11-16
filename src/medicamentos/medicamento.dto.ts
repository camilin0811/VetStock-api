import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
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

export class ActualizarMedicamentoDto extends PartialType(MedicamentoDto) {}

export class MedicamentoResponseDto extends MedicamentoDto {
  id: number;
}
