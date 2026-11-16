import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { DispensacionController } from './dispensacion.controller';
import { DispensacionService } from './dispensacion.service';
import { Dispensacion } from './entities/dispensacion.entity';

// El FEFO descuenta lotes con el EntityManager de la transaccion, por eso no
// se importa InventarioModule ni se registra el repositorio de Lote.
@Module({
  imports: [TypeOrmModule.forFeature([Dispensacion]), MedicamentosModule],
  controllers: [DispensacionController],
  providers: [DispensacionService],
  exports: [DispensacionService],
})
export class DispensacionesModule {}
