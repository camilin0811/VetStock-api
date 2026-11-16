import { Module } from '@nestjs/common';
import { DispensacionesModule } from '../dispensaciones/dispensaciones.module';
import { InventarioModule } from '../inventario/inventario.module';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { ReporteController } from './reporte.controller';
import { ReporteService } from './reporte.service';

@Module({
  imports: [DispensacionesModule, InventarioModule, MedicamentosModule],
  controllers: [ReporteController],
  providers: [ReporteService],
})
export class ReportesModule {}
