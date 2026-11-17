import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba } from '../../test/bd-prueba';
import { Usuario } from '../auth/entities/usuario.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { diasDesdeHoy } from '../common/fechas';
import { Dispensacion } from '../dispensaciones/entities/dispensacion.entity';
import { Lote } from '../inventario/entities/lote.entity';
import { Movimiento } from '../inventario/entities/movimiento.entity';
import { InventarioModule } from '../inventario/inventario.module';
import { InventarioService } from '../inventario/inventario.service';
import { Medicamento } from '../medicamentos/entities/medicamento.entity';
import { Proveedor } from '../proveedores/entities/proveedor.entity';
import { ReportesModule } from '../reportes/reportes.module';
import { ReporteService } from '../reportes/reporte.service';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { CLAVE_DEMO, sembrar } from './seed';

describe('seed', () => {
  let testingModule: TestingModule;
  let dataSource: DataSource;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...importacionesBdPrueba(),
        AuthModule,
        InventarioModule,
        ReportesModule,
      ],
    }).compile();
    dataSource = testingModule.get(DataSource);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('crea los volumenes pedidos', async () => {
    const resumen = await sembrar(dataSource);

    expect(resumen).toMatchObject({
      usuarios: 3,
      categorias: 5,
      proveedores: 4,
      anuladas: 2,
    });
    expect(resumen.medicamentos).toBeGreaterThanOrEqual(15);
    expect(resumen.lotes).toBeGreaterThanOrEqual(28);
    expect(resumen.dispensaciones).toBeGreaterThanOrEqual(35);
    expect(resumen.ajustes).toBeGreaterThanOrEqual(3);
    expect(await dataSource.getRepository(Categoria).count()).toBe(5);
    expect(await dataSource.getRepository(Proveedor).count()).toBe(4);
    expect(await dataSource.getRepository(Medicamento).count()).toBe(
      resumen.medicamentos,
    );
  });

  it('crea los usuarios demo con clave hasheada que permite ingresar', async () => {
    await sembrar(dataSource);
    const auth = testingModule.get(AuthService);

    for (const [correo, rol] of [
      ['admin@vetstock.com', 'admin'],
      ['vet@vetstock.com', 'veterinario'],
      ['farmacia@vetstock.com', 'farmaceutico'],
    ]) {
      const { data } = await auth.login({ correo, clave: CLAVE_DEMO });
      expect(data.usuario.rol).toBe(rol);
    }
    const guardado = await dataSource
      .getRepository(Usuario)
      .createQueryBuilder('u')
      .addSelect('u.clave')
      .getOneOrFail();
    expect(await bcrypt.compare(CLAVE_DEMO, guardado.clave)).toBe(true);
    expect(guardado.clave).not.toBe(CLAVE_DEMO);
  });

  it('reparte las dispensaciones en los ultimos 14 dias, con varias hoy', async () => {
    await sembrar(dataSource);

    const dispensaciones = await dataSource.getRepository(Dispensacion).find();
    const fechas = new Set(dispensaciones.map((d) => d.fecha));

    expect(dispensaciones.length).toBeGreaterThanOrEqual(35);
    for (const fecha of fechas) {
      expect(fecha >= diasDesdeHoy(-13) && fecha <= diasDesdeHoy(0)).toBe(true);
    }
    expect(fechas.size).toBeGreaterThanOrEqual(10);
    expect(
      dispensaciones.filter((d) => d.fecha === diasDesdeHoy(0)).length,
    ).toBeGreaterThanOrEqual(3);
    expect(dispensaciones.filter((d) => d.estado === 'ANULADA')).toHaveLength(
      2,
    );
    expect(dispensaciones.every((d) => d.usuarioId !== null)).toBe(true);
    expect(
      dispensaciones.filter((d) => d.formula !== null).length,
    ).toBeGreaterThan(0);
  });

  it('el stock de cada lote coincide con el kardex', async () => {
    await sembrar(dataSource);

    const lotes = await dataSource.getRepository(Lote).find();
    const movimientos = await dataSource.getRepository(Movimiento).find();
    const signo = { ENTRADA: 1, ANULACION: 1, SALIDA: -1, AJUSTE: -1 } as const;

    for (const lote of lotes) {
      const saldo = movimientos
        .filter((m) => m.loteId === lote.id)
        .reduce((total, m) => total + signo[m.tipo] * m.cantidad, 0);
      expect(saldo).toBe(lote.cantidad);
      expect(lote.cantidad).toBeGreaterThanOrEqual(0);
    }
  });

  it('los movimientos tienen fecha historica y nunca futura', async () => {
    await sembrar(dataSource);

    const movimientos = await dataSource
      .getRepository(Movimiento)
      .find({ order: { id: 'ASC' } });

    for (const movimiento of movimientos) {
      expect(movimiento.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    }
    expect(movimientos[0].createdAt.getTime()).toBeLessThan(
      Date.now() - 30 * 86_400_000,
    );
    const tipos = new Set(movimientos.map((m) => m.tipo));
    expect([...tipos].sort()).toEqual([
      'AJUSTE',
      'ANULACION',
      'ENTRADA',
      'SALIDA',
    ]);
  });

  it('deja datos para las alertas: stock bajo, por vencer, vencidos y sin stock', async () => {
    await sembrar(dataSource);

    const { data } = await testingModule
      .get(InventarioService)
      .listarInventario();
    const estados = (estado: string) =>
      data.filter((i) => i.estado === estado).length;
    const resumen = await testingModule.get(ReporteService).resumen();

    expect(estados('STOCK_BAJO')).toBeGreaterThanOrEqual(2);
    expect(estados('SIN_STOCK')).toBeGreaterThanOrEqual(1);
    expect(estados('OK')).toBeGreaterThanOrEqual(8);
    expect(resumen.porVencer).toBeGreaterThanOrEqual(3);
    expect(resumen.vencidos).toBeGreaterThanOrEqual(2);
    expect(resumen.dispensacionesHoy).toBeGreaterThanOrEqual(3);
    expect(resumen.proximosVencimientos).toHaveLength(5);
    expect(
      resumen.consumoUltimos7Dias.filter((d) => d.unidades > 0).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it('es idempotente: borra y vuelve a crear los mismos datos', async () => {
    const primero = await sembrar(dataSource);
    const idMinimo = async () =>
      (
        await dataSource
          .getRepository(Lote)
          .find({ order: { id: 'ASC' }, take: 1 })
      )[0].id;
    expect(await idMinimo()).toBe(1);

    const segundo = await sembrar(dataSource);

    expect(segundo).toEqual(primero);
    expect(await idMinimo()).toBe(1);
    expect(await dataSource.getRepository(Usuario).count()).toBe(3);
    expect(await dataSource.getRepository(Lote).count()).toBe(primero.lotes);
    expect(await dataSource.getRepository(Dispensacion).count()).toBe(
      primero.dispensaciones,
    );
  });

  it('reemplaza los datos previos de otras pruebas', async () => {
    await dataSource.getRepository(Categoria).save({ nombre: 'Temporal' });

    await sembrar(dataSource);

    expect(
      await dataSource
        .getRepository(Categoria)
        .findOneBy({ nombre: 'Temporal' }),
    ).toBeNull();
  });
});
