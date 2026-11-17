import * as bcrypt from 'bcrypt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Rol } from '../src/auth/rol.enum';
import { Usuario } from '../src/auth/entities/usuario.entity';
import { Categoria } from '../src/categorias/entities/categoria.entity';
import { diasDesdeHoy } from '../src/common/fechas';
import { Dispensacion } from '../src/dispensaciones/entities/dispensacion.entity';
import { Lote } from '../src/inventario/entities/lote.entity';
import { Movimiento } from '../src/inventario/entities/movimiento.entity';
import { Medicamento } from '../src/medicamentos/entities/medicamento.entity';
import { Proveedor } from '../src/proveedores/entities/proveedor.entity';

export const CLAVE_PRUEBA = 'VetStock123*';

export const USUARIOS_PRUEBA = {
  admin: 'andres@vetstock.com',
  veterinario: 'vet@vetstock.com',
  farmaceutico: 'farmacia@vetstock.com',
};

const ENTIDADES = [
  Usuario,
  Categoria,
  Medicamento,
  Proveedor,
  Lote,
  Dispensacion,
  Movimiento,
];

// BD sqlite en memoria; cada prueba importa ademas los modulos que necesita
export function importacionesBdPrueba() {
  return [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: ENTIDADES,
      synchronize: true,
      dropSchema: true,
    }),
  ];
}

export async function sembrarBd(dataSource: DataSource) {
  const clave = bcrypt.hashSync(CLAVE_PRUEBA, 4);
  await dataSource.getRepository(Usuario).save([
    {
      id: 1,
      nombre: 'Andres',
      correo: USUARIOS_PRUEBA.admin,
      clave,
      rol: Rol.Admin,
    },
    {
      id: 2,
      nombre: 'Paola',
      correo: USUARIOS_PRUEBA.veterinario,
      clave,
      rol: Rol.Veterinario,
    },
    {
      id: 3,
      nombre: 'Camila',
      correo: USUARIOS_PRUEBA.farmaceutico,
      clave,
      rol: Rol.Farmaceutico,
    },
  ]);

  await dataSource.getRepository(Categoria).save([
    {
      id: 1,
      nombre: 'Antibioticos',
      descripcion: 'Tratamiento de infecciones',
    },
    { id: 2, nombre: 'Vacunas', descripcion: 'Prevencion y esquemas' },
    { id: 3, nombre: 'Antiinflamatorios', descripcion: null },
    { id: 4, nombre: 'Antiparasitarios', descripcion: 'Internos y externos' },
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
      categorias: [{ id: 1 }],
    },
    {
      id: 2,
      nombre: 'Vacuna antirrabica',
      presentacion: 'Frasco 1 ml',
      especie: 'general',
      precio: 25000,
      stockMinimo: 10,
      requiereFormula: false,
      categorias: [{ id: 2 }],
    },
    {
      id: 3,
      nombre: 'Meloxicam 1.5 mg/ml',
      presentacion: 'Suspension oral 10 ml',
      especie: 'felino',
      precio: 32000,
      stockMinimo: 5,
      requiereFormula: true,
      categorias: [{ id: 3 }],
    },
    {
      id: 4,
      nombre: 'Desparasitante Albendazol',
      presentacion: 'Suspension 100 ml',
      especie: 'bovino',
      precio: 45000,
      stockMinimo: 8,
      requiereFormula: false,
      categorias: [{ id: 4 }],
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

  // Kardex: una ENTRADA por lote (cantidad inicial) y las salidas de las dispensaciones
  await dataSource.getRepository(Movimiento).save([
    ...[
      [1, 1, 40],
      [2, 2, 30],
      [3, 2, 12],
      [4, 3, 10],
      [5, 3, 10],
      [6, 4, 25],
    ].map(([loteId, medicamentoId, cantidad]) => ({
      tipo: 'ENTRADA' as const,
      cantidad,
      lote: { id: loteId },
      medicamento: { id: medicamentoId },
      usuario: { id: 3 },
      detalle: 'Ingreso inicial',
    })),
    {
      tipo: 'SALIDA' as const,
      cantidad: 25,
      lote: { id: 1 },
      medicamento: { id: 1 },
      usuario: { id: 2 },
      detalle: 'Dispensacion 1 - Max',
    },
    {
      tipo: 'SALIDA' as const,
      cantidad: 6,
      lote: { id: 4 },
      medicamento: { id: 3 },
      usuario: null,
      detalle: 'Dispensacion 2 - Luna',
    },
  ]);
}
