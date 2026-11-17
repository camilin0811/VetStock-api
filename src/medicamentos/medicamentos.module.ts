import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasModule } from '../categorias/categorias.module';
import { Dispensacion } from '../dispensaciones/entities/dispensacion.entity';
import { Lote } from '../inventario/entities/lote.entity';
import { Medicamento } from './entities/medicamento.entity';
import { MedicamentoController } from './medicamento.controller';
import { MedicamentoService } from './medicamento.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medicamento, Lote, Dispensacion]),
    CategoriasModule,
  ],
  controllers: [MedicamentoController],
  providers: [MedicamentoService],
  exports: [MedicamentoService],
})
export class MedicamentosModule {}
