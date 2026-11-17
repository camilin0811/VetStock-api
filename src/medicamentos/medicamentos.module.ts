import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasModule } from '../categorias/categorias.module';
import { Medicamento } from './entities/medicamento.entity';
import { MedicamentoController } from './medicamento.controller';
import { MedicamentoService } from './medicamento.service';

@Module({
  imports: [TypeOrmModule.forFeature([Medicamento]), CategoriasModule],
  controllers: [MedicamentoController],
  providers: [MedicamentoService],
  exports: [MedicamentoService],
})
export class MedicamentosModule {}
