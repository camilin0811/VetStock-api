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
import { ActualizarProveedorDto, ProveedorDto } from './proveedor.dto';
import { ProveedorService } from './proveedor.service';

@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Get()
  listar() {
    return this.proveedorService.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.obtener(id);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post()
  crear(@Body() datos: ProveedorDto) {
    return this.proveedorService.crear(datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put(':id')
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ProveedorDto,
  ) {
    return this.proveedorService.reemplazar(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarProveedorDto,
  ) {
    return this.proveedorService.actualizar(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.eliminar(id);
  }
}
