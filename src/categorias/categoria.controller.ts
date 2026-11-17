import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import { ActualizarCategoriaDto, CategoriaDto } from './categoria.dto';
import { CategoriaService } from './categoria.service';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get()
  listar() {
    return this.categoriaService.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.obtener(id);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post()
  crear(@Body() datos: CategoriaDto) {
    return this.categoriaService.crear(datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put(':id')
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CategoriaDto,
  ) {
    return this.categoriaService.reemplazar(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarCategoriaDto,
  ) {
    return this.categoriaService.actualizar(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.eliminar(id);
  }
}
