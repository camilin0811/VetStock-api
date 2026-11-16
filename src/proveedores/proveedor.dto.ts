import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ProveedorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  nit: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  correo?: string;
}

export class ActualizarProveedorDto extends PartialType(ProveedorDto) {}

export class ProveedorResponseDto extends ProveedorDto {
  id: number;
}
