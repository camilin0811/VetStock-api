import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
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

  @Post()
  crear(@Body() datos: CategoriaDto) {
    return this.categoriaService.crear(datos);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarCategoriaDto,
  ) {
    return this.categoriaService.actualizar(id, datos);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.eliminar(id);
  }
}
