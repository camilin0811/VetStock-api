import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ENTIDADES } from '../src/app.module';
import { Usuario } from '../src/auth/entities/usuario.entity';
import { diasDesdeHoy } from '../src/common/fechas';
import { Dispensacion } from '../src/dispensaciones/entities/dispensacion.entity';
import { Lote } from '../src/inventario/entities/lote.entity';
import { Medicamento } from '../src/medicamentos/entities/medicamento.entity';
import { Proveedor } from '../src/proveedores/entities/proveedor.entity';

export function importacionesBdPrueba() {
  return [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: ENTIDADES,
      synchronize: true,
      dropSchema: true,
    }),
    TypeOrmModule.forFeature(ENTIDADES),
  ];
}

export async function sembrarBd(dataSource: DataSource) {
  await dataSource.getRepository(Usuario).save([
    {
      id: 1,
      nombre: 'Andres',
      correo: 'andres@vetstock.com',
      clave: '123456',
    },
  ]);

  await dataSource.getRepository(Medicamento).save([
    {
      id: 1,
      nombre: 'Amoxicilina 250 mg',
      presentacion: 'Tabletas x 10',
      especie: 'canino',
      precio: 18000,
      stockMinimo: 20,
      requiereFormula: true,
    },
    {
      id: 2,
      nombre: 'Vacuna antirrabica',
      presentacion: 'Frasco 1 ml',
      especie: 'general',
      precio: 25000,
      stockMinimo: 10,
      requiereFormula: false,
    },
    {
      id: 3,
      nombre: 'Meloxicam 1.5 mg/ml',
      presentacion: 'Suspension oral 10 ml',
      especie: 'felino',
      precio: 32000,
      stockMinimo: 5,
      requiereFormula: true,
    },
    {
      id: 4,
      nombre: 'Desparasitante Albendazol',
      presentacion: 'Suspension 100 ml',
      especie: 'bovino',
      precio: 45000,
      stockMinimo: 8,
      requiereFormula: false,
    },
  ]);

  await dataSource.getRepository(Proveedor).save([
    {
      id: 1,
      nombre: 'Distribuidora Agrovet Narino',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Pasto',
    },
    {
      id: 2,
      nombre: 'Laboratorios Pet Salud',
      nit: '800987654-2',
      telefono: '3109876543',
      ciudad: 'Cali',
    },
  ]);

  await dataSource.getRepository(Lote).save([
    {
      id: 1,
      medicamentoId: 1,
      proveedorId: 1,
      numeroLote: 'AMX-001',
      cantidadInicial: 40,
      cantidad: 15,
      fechaIngreso: diasDesdeHoy(-60),
      fechaVencimiento: diasDesdeHoy(200),
    },
    {
      id: 2,
      medicamentoId: 2,
      proveedorId: 2,
      numeroLote: 'VAR-101',
      cantidadInicial: 30,
      cantidad: 30,
      fechaIngreso: diasDesdeHoy(-90),
      fechaVencimiento: diasDesdeHoy(20),
    },
    {
      id: 3,
      medicamentoId: 2,
      proveedorId: 2,
      numeroLote: 'VAR-102',
      cantidadInicial: 12,
      cantidad: 12,
      fechaIngreso: diasDesdeHoy(-10),
      fechaVencimiento: diasDesdeHoy(300),
    },
    {
      id: 4,
      medicamentoId: 3,
      proveedorId: 1,
      numeroLote: 'MLX-050',
      cantidadInicial: 10,
      cantidad: 4,
      fechaIngreso: diasDesdeHoy(-400),
      fechaVencimiento: diasDesdeHoy(-10),
    },
    {
      id: 5,
      medicamentoId: 3,
      proveedorId: 1,
      numeroLote: 'MLX-051',
      cantidadInicial: 10,
      cantidad: 10,
      fechaIngreso: diasDesdeHoy(-20),
      fechaVencimiento: diasDesdeHoy(150),
    },
    {
      id: 6,
      medicamentoId: 4,
      proveedorId: 1,
      numeroLote: 'ALB-300',
      cantidadInicial: 25,
      cantidad: 25,
      fechaIngreso: diasDesdeHoy(-30),
      fechaVencimiento: diasDesdeHoy(400),
    },
  ]);

  await dataSource.getRepository(Dispensacion).save([
    {
      id: 1,
      medicamentoId: 1,
      cantidad: 25,
      mascota: 'Max',
      veterinario: 'Dra. Paola Rosero',
      formula: 'F-1001',
      fecha: diasDesdeHoy(-30),
      total: 450000,
      lotesUsados: [{ loteId: 1, numeroLote: 'AMX-001', cantidad: 25 }],
    },
    {
      id: 2,
      medicamentoId: 3,
      cantidad: 6,
      mascota: 'Luna',
      veterinario: 'Dr. Carlos Erazo',
      formula: 'F-0950',
      fecha: diasDesdeHoy(-100),
      total: 192000,
      lotesUsados: [{ loteId: 4, numeroLote: 'MLX-050', cantidad: 6 }],
    },
  ]);
}
