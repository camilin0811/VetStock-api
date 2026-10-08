import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { DispensacionController } from './dispensaciones/dispensacion.controller';
import { DispensacionService } from './dispensaciones/dispensacion.service';
import { AlertaService } from './inventario/alerta.service';
import { InventarioController } from './inventario/inventario.controller';
import { InventarioService } from './inventario/inventario.service';
import { MedicamentoController } from './medicamentos/medicamento.controller';
import { MedicamentoService } from './medicamentos/medicamento.service';
import { ProveedorController } from './proveedores/proveedor.controller';
import { ProveedorService } from './proveedores/proveedor.service';
import { ReporteController } from './reportes/reporte.controller';
import { ReporteService } from './reportes/reporte.service';

@Module({
  imports: [],
  controllers: [
    AuthController,
    MedicamentoController,
    ProveedorController,
    InventarioController,
    DispensacionController,
    ReporteController,
  ],
  providers: [
    AuthService,
    MedicamentoService,
    ProveedorService,
    InventarioService,
    AlertaService,
    DispensacionService,
    ReporteService,
  ],
})
export class AppModule {}
