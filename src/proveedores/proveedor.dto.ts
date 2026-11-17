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
  @MaxLength(255)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nit: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  telefono: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
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
