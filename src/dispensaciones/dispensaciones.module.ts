import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lote } from '../inventario/entities/lote.entity';
import { Movimiento } from '../inventario/entities/movimiento.entity';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { DispensacionController } from './dispensacion.controller';
import { DispensacionService } from './dispensacion.service';
import { Dispensacion } from './entities/dispensacion.entity';

// El FEFO descuenta lotes y registra movimientos con el EntityManager de la
// transaccion; Lote y Movimiento se registran solo para que TypeORM los cargue.
@Module({
  imports: [
    TypeOrmModule.forFeature([Dispensacion, Lote, Movimiento]),
    MedicamentosModule,
  ],
  controllers: [DispensacionController],
  providers: [DispensacionService],
  exports: [DispensacionService],
})
export class DispensacionesModule {}
