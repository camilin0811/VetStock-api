import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AlertaService } from './inventario/alerta.service';
import { InventarioController } from './inventario/inventario.controller';
import { InventarioService } from './inventario/inventario.service';
import { MedicamentoController } from './medicamentos/medicamento.controller';
import { MedicamentoService } from './medicamentos/medicamento.service';
import { ProveedorController } from './proveedores/proveedor.controller';
import { ProveedorService } from './proveedores/proveedor.service';

@Module({
  imports: [],
  controllers: [
    AuthController,
    MedicamentoController,
    ProveedorController,
    InventarioController,
  ],
  providers: [
    AuthService,
    MedicamentoService,
    ProveedorService,
    InventarioService,
    AlertaService,
  ],
})
export class AppModule {}
