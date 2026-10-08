import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DispensacionRequestDto } from './dispensacion.dto';
import { DispensacionService } from './dispensacion.service';

@Controller('dispensaciones')
export class DispensacionController {
  constructor(private readonly dispensacionService: DispensacionService) {}

  @Post()
  dispensar(@Body() datos: DispensacionRequestDto) {
    return this.dispensacionService.dispensar(datos);
  }

  @Get()
  listar() {
    return this.dispensacionService.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.dispensacionService.obtener(id);
  }
}
