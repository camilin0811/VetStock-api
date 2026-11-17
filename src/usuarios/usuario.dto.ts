import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Rol } from '../auth/rol.enum';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  clave: string;

  @IsEnum(Rol)
  rol: Rol;
}

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clave?: string;
}
