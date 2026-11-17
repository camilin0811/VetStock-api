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
  Query,
} from '@nestjs/common';
import { Rol } from '../auth/rol.enum';
import { Roles } from '../auth/roles.decorator';
import {
  ActualizarMedicamentoDto,
  MedicamentoDto,
  MedicamentoQueryDto,
} from './medicamento.dto';
import { MedicamentoService } from './medicamento.service';

@ApiTags('Medicamentos')
@ApiBearerAuth()
@Controller('medicamentos')
export class MedicamentoController {
  constructor(private readonly medicamentoService: MedicamentoService) {}

  /** Lista medicamentos con filtros opcionales (q, especie, categoriaId) */
  @Get()
  listar(@Query() filtro: MedicamentoQueryDto) {
    return this.medicamentoService.listar(filtro);
  }

  /** Obtiene un medicamento por id */
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentoService.obtener(id);
  }

  /** Crea un medicamento */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post()
  crear(@Body() datos: MedicamentoDto) {
    return this.medicamentoService.crear(datos);
  }

  /** Reemplaza un medicamento completo (sin categoriaIds se quitan las categorias) */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put(':id')
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: MedicamentoDto,
  ) {
    return this.medicamentoService.reemplazar(id, datos);
  }

  /** Actualiza parcialmente un medicamento */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarMedicamentoDto,
  ) {
    return this.medicamentoService.actualizar(id, datos);
  }

  /** Elimina un medicamento sin lotes ni dispensaciones */
  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentoService.eliminar(id);
  }
}
