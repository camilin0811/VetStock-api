import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medicamento } from './entities/medicamento.entity';
import { MedicamentoController } from './medicamento.controller';
import { MedicamentoService } from './medicamento.service';

@Module({
  imports: [TypeOrmModule.forFeature([Medicamento])],
  controllers: [MedicamentoController],
  providers: [MedicamentoService],
  exports: [MedicamentoService],
})
export class MedicamentosModule {}
