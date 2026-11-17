import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DispensacionesModule } from './dispensaciones/dispensaciones.module';
import { Env } from './env.model';
import { InventarioModule } from './inventario/inventario.module';
import { MedicamentosModule } from './medicamentos/medicamentos.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    AuthModule,
    MedicamentosModule,
    ProveedoresModule,
    InventarioModule,
    DispensacionesModule,
    ReportesModule,
  ],
})
export class AppModule {}
