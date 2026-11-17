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

@Controller('medicamentos')
export class MedicamentoController {
  constructor(private readonly medicamentoService: MedicamentoService) {}

  @Get()
  listar(@Query() filtro: MedicamentoQueryDto) {
    return this.medicamentoService.listar(filtro);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentoService.obtener(id);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Post()
  crear(@Body() datos: MedicamentoDto) {
    return this.medicamentoService.crear(datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Put(':id')
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: MedicamentoDto,
  ) {
    return this.medicamentoService.reemplazar(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarMedicamentoDto,
  ) {
    return this.medicamentoService.actualizar(id, datos);
  }

  @Roles(Rol.Admin, Rol.Farmaceutico)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentoService.eliminar(id);
  }
}
