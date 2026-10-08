import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MedicamentoController } from './medicamentos/medicamento.controller';
import { MedicamentoService } from './medicamentos/medicamento.service';

@Module({
  imports: [],
  controllers: [AuthController, MedicamentoController],
  providers: [AuthService, MedicamentoService],
})
export class AppModule {}
