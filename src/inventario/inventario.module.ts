import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { ProveedoresModule } from '../proveedores/proveedores.module';
import { AlertaService } from './alerta.service';
import { Lote } from './entities/lote.entity';
import { Movimiento } from './entities/movimiento.entity';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { MovimientoService } from './movimiento.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lote, Movimiento]),
    MedicamentosModule,
    ProveedoresModule,
  ],
  controllers: [InventarioController],
  providers: [InventarioService, AlertaService, MovimientoService],
  exports: [InventarioService, MovimientoService],
})
export class InventarioModule {}
