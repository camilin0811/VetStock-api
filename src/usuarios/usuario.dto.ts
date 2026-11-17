import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
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
  @MinLength(8, { message: 'La clave debe tener al menos 8 caracteres' })
  clave: string;

  @IsEnum(Rol)
  rol: Rol;
}

// PUT: nombre, correo y rol obligatorios; la clave es opcional (si falta, se conserva)
export class ReemplazarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsEmail()
  @MaxLength(255)
  correo: string;

  @IsEnum(Rol)
  rol: Rol;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La clave debe tener al menos 8 caracteres' })
  clave?: string;
}

export class CambiarRolDto {
  @IsEnum(Rol)
  rol: Rol;
}

// PATCH: solo cambia los campos enviados
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
  @MinLength(8, { message: 'La clave debe tener al menos 8 caracteres' })
  clave?: string;
}
