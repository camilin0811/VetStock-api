import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import type { Usuario } from '../auth/entities/usuario.entity';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { ActualizarUsuarioDto } from './usuario.dto';
import { UsuarioService } from './usuario.service';

@Roles(Rol.Admin)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.obtener(id);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarUsuarioDto,
  ) {
    return this.usuarioService.actualizar(id, datos);
  }

  @Delete(':id')
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() actual: Usuario,
  ) {
    return this.usuarioService.eliminar(id, actual.id);
  }
}
