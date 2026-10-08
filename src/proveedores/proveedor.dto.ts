import { IsNotEmpty, IsString } from 'class-validator';

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
}

export class ProveedorResponseDto extends ProveedorDto {
  id: string;
}
