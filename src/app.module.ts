import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { Usuario } from './auth/entities/usuario.entity';
import { DispensacionController } from './dispensaciones/dispensacion.controller';
import { DispensacionService } from './dispensaciones/dispensacion.service';
import { Dispensacion } from './dispensaciones/entities/dispensacion.entity';
import { Env } from './env.model';
import { AlertaService } from './inventario/alerta.service';
import { Lote } from './inventario/entities/lote.entity';
import { InventarioController } from './inventario/inventario.controller';
import { InventarioService } from './inventario/inventario.service';
import { Medicamento } from './medicamentos/entities/medicamento.entity';
import { MedicamentoController } from './medicamentos/medicamento.controller';
import { MedicamentoService } from './medicamentos/medicamento.service';
import { Proveedor } from './proveedores/entities/proveedor.entity';
import { ProveedorController } from './proveedores/proveedor.controller';
import { ProveedorService } from './proveedores/proveedor.service';
import { ReporteController } from './reportes/reporte.controller';
import { ReporteService } from './reportes/reporte.service';

export const ENTIDADES = [Usuario, Medicamento, Proveedor, Lote, Dispensacion];

export const CONTROLADORES = [
  AuthController,
  MedicamentoController,
  ProveedorController,
  InventarioController,
  DispensacionController,
  ReporteController,
];

export const PROVEEDORES = [
  AuthService,
  MedicamentoService,
  ProveedorService,
  InventarioService,
  AlertaService,
  DispensacionService,
  ReporteService,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (
        configService: ConfigService<Env>,
      ): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.getOrThrow('POSTGRES_HOST'),
        port: Number(configService.getOrThrow('POSTGRES_PORT')),
        username: configService.getOrThrow('POSTGRES_USER'),
        password: configService.getOrThrow('POSTGRES_PASSWORD'),
        database: configService.getOrThrow('POSTGRES_DB'),
        autoLoadEntities: true,
        // shortcut: synchronize para el curso; migraciones antes de produccion
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(ENTIDADES),
  ],
  controllers: CONTROLADORES,
  providers: PROVEEDORES,
})
export class AppModule {}
