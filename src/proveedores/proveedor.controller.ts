import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProveedorDto } from './proveedor.dto';
import { ProveedorService } from './proveedor.service';

@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Get()
  listar() {
    return this.proveedorService.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.proveedorService.obtener(id);
  }

  @Post()
  crear(@Body() datos: ProveedorDto) {
    return this.proveedorService.crear(datos);
  }
}
