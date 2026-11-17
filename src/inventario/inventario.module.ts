import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { ProveedoresModule } from '../proveedores/proveedores.module';
import { AlertaService } from './alerta.service';
import { Lote } from './entities/lote.entity';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lote]),
    MedicamentosModule,
    ProveedoresModule,
  ],
  controllers: [InventarioController],
  providers: [InventarioService, AlertaService],
  exports: [InventarioService],
})
export class InventarioModule {}
