import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ActualizarMedicamentoDto, MedicamentoDto } from './medicamento.dto';
import { MedicamentoService } from './medicamento.service';

@Controller('medicamentos')
export class MedicamentoController {
  constructor(private readonly medicamentoService: MedicamentoService) {}

  @Get()
  listar() {
    return this.medicamentoService.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.medicamentoService.obtener(id);
  }

  @Post()
  crear(@Body() datos: MedicamentoDto) {
    return this.medicamentoService.crear(datos);
  }

  @Put(':id')
  actualizar(@Param('id') id: string, @Body() datos: ActualizarMedicamentoDto) {
    return this.medicamentoService.actualizar(id, datos);
  }
}
