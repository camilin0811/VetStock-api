import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { Usuario } from './entities/usuario.entity';
import { Rol } from './rol.enum';

export class RegistroDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La clave debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La clave no puede superar 72 caracteres' })
  clave: string;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  clave: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}
