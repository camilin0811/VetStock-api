import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CategoriaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}

export class ActualizarCategoriaDto extends PartialType(CategoriaDto) {}

export class CategoriaResponseDto extends CategoriaDto {
  id: number;
}
