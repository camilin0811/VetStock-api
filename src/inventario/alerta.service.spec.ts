import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { Medicamento } from '../medicamentos/entities/medicamento.entity';
import { AlertaService } from './alerta.service';
import { InventarioModule } from './inventario.module';

describe('AlertaService', () => {
  let service: AlertaService;
  let dataSource: DataSource;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), InventarioModule],
    }).compile();
    dataSource = testingModule.get(DataSource);
    await sembrarBd(dataSource);

    service = testingModule.get<AlertaService>(AlertaService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await testingModule.close();
  });

  it('genera las tres alertas con los datos del lote', async () => {
    const { data, count } = await service.generar();

    expect(count).toBe(3);
    expect(data.map((a) => a.tipo)).toEqual([
      'STOCK_BAJO',
      'VENCIDO',
      'POR_VENCER',
    ]);
    expect(data[0]).toMatchObject({
      medicamento: expect.objectContaining({ id: 1 }),
      mensaje: 'Quedan 15 unidades, el minimo es 20',
    });
    expect(data[0].loteId).toBeUndefined();
    expect(data[1]).toMatchObject({
      loteId: 4,
      diasRestantes: -10,
      medicamento: expect.objectContaining({ id: 3 }),
    });
    expect(data[2]).toMatchObject({
      loteId: 2,
      diasRestantes: 20,
      medicamento: expect.objectContaining({ id: 2 }),
    });
    expect(data[2].fechaVencimiento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each([
    ['STOCK_BAJO', [1]],
    ['VENCIDO', [4]],
    ['POR_VENCER', [2]],
  ] as const)('filtra por tipo %s', async (tipo, loteIdsOMed) => {
    const { data } = await service.generar({ tipo });

    expect(data.every((a) => a.tipo === tipo)).toBe(true);
    expect(data.map((a) => a.loteId ?? a.medicamento.id)).toEqual(loteIdsOMed);
  });

  it('dias controla la ventana de POR_VENCER', async () => {
    const porVencer = async (dias: number) =>
      (await service.generar({ tipo: 'POR_VENCER', dias })).data.map(
        (a) => a.loteId,
      );

    expect(await porVencer(10)).toEqual([]);
    expect(await porVencer(20)).toEqual([2]);
    expect(await porVencer(250)).toEqual([2, 5, 1]);
  });

  it('ignora lotes sin unidades', async () => {
    await dataSource.query('UPDATE lote SET cantidad = 0 WHERE id = 4');

    const { data } = await service.generar({ tipo: 'VENCIDO' });

    expect(data).toEqual([]);
  });

  it('marca stock bajo a un medicamento sin lotes', async () => {
    await dataSource.getRepository(Medicamento).save({
      nombre: 'Suero oral',
      presentacion: 'Sobre 20 g',
      especie: 'general',
      precio: 1500,
      stockMinimo: 2,
      requiereFormula: false,
    });

    const { data } = await service.generar({ tipo: 'STOCK_BAJO' });

    expect(data.map((a) => a.medicamento.nombre)).toContain('Suero oral');
  });

  it('hace la misma cantidad de consultas aunque haya mas medicamentos (sin N+1)', async () => {
    // Cada consulta pasa por query() del QueryRunner del driver (sqlite)
    const runner = dataSource.createQueryRunner();
    const espia = jest.spyOn(Object.getPrototypeOf(runner), 'query');
    await runner.release();
    const contar = async () => {
      espia.mockClear();
      await service.generar();
      return espia.mock.calls.length;
    };

    const antes = await contar();
    await dataSource.getRepository(Medicamento).save(
      Array.from({ length: 12 }, (_, i) => ({
        nombre: `Medicamento extra ${i}`,
        presentacion: 'Caja',
        especie: 'general',
        precio: 1000,
        stockMinimo: 5,
        requiereFormula: false,
      })),
    );
    const despues = await contar();

    expect(antes).toBeGreaterThan(0);
    expect(antes).toBeLessThanOrEqual(3);
    expect(despues).toBe(antes);
  });
});
