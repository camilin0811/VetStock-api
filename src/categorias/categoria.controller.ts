import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Categorias')
@ApiBearerAuth()
@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  /** Lista las categorias */
  @Get()
  listar() {
    return this.categoriaService.listar();
  }

  /** Obtiene una categoria por id */
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.obtener(id);
  }

  /** Crea una categoria */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post()
  crear(@Body() datos: CategoriaDto) {
    return this.categoriaService.crear(datos);
  }

  /** Reemplaza una categoria completa */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put(':id')
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CategoriaDto,
  ) {
    return this.categoriaService.reemplazar(id, datos);
  }

  /** Actualiza parcialmente una categoria */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarCategoriaDto,
  ) {
    return this.categoriaService.actualizar(id, datos);
  }

  /** Elimina una categoria */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.eliminar(id);
  }
}
