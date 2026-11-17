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
import { ActualizarProveedorDto, ProveedorDto } from './proveedor.dto';
import { ProveedorService } from './proveedor.service';

@ApiTags('Proveedores')
@ApiBearerAuth()
@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  /** Lista los proveedores */
  @Get()
  listar() {
    return this.proveedorService.listar();
  }

  /** Obtiene un proveedor por id */
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.obtener(id);
  }

  /** Crea un proveedor */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post()
  crear(@Body() datos: ProveedorDto) {
    return this.proveedorService.crear(datos);
  }

  /** Reemplaza un proveedor completo (sin correo se borra) */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put(':id')
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ProveedorDto,
  ) {
    return this.proveedorService.reemplazar(id, datos);
  }

  /** Actualiza parcialmente un proveedor */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarProveedorDto,
  ) {
    return this.proveedorService.actualizar(id, datos);
  }

  /** Elimina un proveedor sin lotes */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.eliminar(id);
  }
}
