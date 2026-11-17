import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  ParseIntPipe,
  Patch,
  Put,
} from '@nestjs/common';
import type { Usuario } from '../auth/entities/usuario.entity';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import {
  ActualizarUsuarioDto,
  CambiarRolDto,
  CrearUsuarioDto,
  ReemplazarUsuarioDto,
} from './usuario.dto';
import { UsuarioService } from './usuario.service';

@Roles(Rol.Admin)
@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  /** Lista los usuarios (solo admin) */
  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  /** Crea un usuario (solo admin) */
  @Post()
  crear(@Body() datos: CrearUsuarioDto) {
    return this.usuarioService.crear(datos);
  }

  /** Obtiene un usuario por id */
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.obtener(id);
  }

  /** Reemplaza un usuario (nombre, correo y rol obligatorios; la clave es opcional) */
  @Put(':id')
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ReemplazarUsuarioDto,
  ) {
    return this.usuarioService.actualizar(id, datos);
  }

  /** Cambia unicamente el rol de un usuario */
  @Patch(':id/rol')
  cambiarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CambiarRolDto,
  ) {
    return this.usuarioService.actualizar(id, datos);
  }

  /** Actualiza parcialmente un usuario */
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarUsuarioDto,
  ) {
    return this.usuarioService.actualizar(id, datos);
  }

  /** Elimina un usuario (no puede ser el propio) */
  @Delete(':id')
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() actual: Usuario,
  ) {
    return this.usuarioService.eliminar(id, actual.id);
  }
}
