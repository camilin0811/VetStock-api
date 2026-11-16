import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispensacionesModule } from '../dispensaciones/dispensaciones.module';
import { Dispensacion } from '../dispensaciones/entities/dispensacion.entity';
import { Lote } from '../inventario/entities/lote.entity';
import { InventarioModule } from '../inventario/inventario.module';
import { Medicamento } from '../medicamentos/entities/medicamento.entity';
import { ReporteController } from './reporte.controller';
import { ReporteService } from './reporte.service';

// Los reportes agregan con QueryBuilder sobre los repositorios (sin recorrer
// registros en memoria ni consultar por medicamento)
@Module({
  imports: [
    TypeOrmModule.forFeature([Dispensacion, Lote, Medicamento]),
    DispensacionesModule,
    InventarioModule,
  ],
  controllers: [ReporteController],
  providers: [ReporteService],
})
export class ReportesModule {}
