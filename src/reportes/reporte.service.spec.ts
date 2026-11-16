import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { diasDesdeHoy } from '../common/fechas';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { DispensacionService } from '../dispensaciones/dispensacion.service';
import { ReportesModule } from './reportes.module';
import { ReporteService } from './reporte.service';

describe('ReporteService', () => {
  let service: ReporteService;
  let dispensacionService: DispensacionService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), ReportesModule],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<ReporteService>(ReporteService);
    dispensacionService =
      testingModule.get<DispensacionService>(DispensacionService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('suma el consumo de los ultimos 30 dias por medicamento', async () => {
    await dispensacionService.dispensar({
      medicamentoId: 1,
      cantidad: 5,
      mascota: 'Max',
      veterinario: 'Dra. Paola Rosero',
      formula: 'F-1002',
    });

    const reporte = await service.consumo({});

    expect(reporte.detalle).toHaveLength(1);
    expect(reporte.detalle[0].unidades).toBe(30);
    expect(reporte.totalVentas).toBe(30 * 18000);
  });

  it('lanza error si el rango de fechas es invalido', async () => {
    await expect(
      service.consumo({ desde: '2026-12-31', hasta: '2026-01-01' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calcula la perdida por lotes vencidos', async () => {
    const reporte = await service.vencimientos();

    expect(reporte.lotes).toHaveLength(1);
    expect(reporte.totalPerdida).toBe(4 * 32000);
  });

  describe('consumo agregado', () => {
    const dispensar = (medicamentoId: number, cantidad: number) =>
      dispensacionService.dispensar({
        medicamentoId,
        cantidad,
        mascota: 'Toby',
        veterinario: 'Dra. Paola Rosero',
        formula: 'F-1',
      });

    it('ordena por unidades, suma el total y devuelve el medicamento', async () => {
      await dispensar(2, 7);
      await dispensar(4, 2);
      await dispensar(2, 3);

      const reporte = await service.consumo({ desde: diasDesdeHoy(-1) });

      expect(
        reporte.detalle.map((d) => [d.medicamento.id, d.unidades]),
      ).toEqual([
        [2, 10],
        [4, 2],
      ]);
      expect(reporte.detalle[0].medicamento.nombre).toBe('Vacuna antirrabica');
      expect(reporte.detalle[0].total).toBe(10 * 25000);
      expect(reporte.totalUnidades).toBe(12);
      expect(reporte.totalVentas).toBe(10 * 25000 + 2 * 45000);
    });

    it('excluye las dispensaciones anuladas', async () => {
      const { data } = await dispensar(2, 7);
      await dispensar(4, 2);
      await dispensacionService.anular(data.id, 'Error');

      const reporte = await service.consumo({ desde: diasDesdeHoy(-1) });

      expect(reporte.detalle.map((d) => d.medicamento.id)).toEqual([4]);
      expect(reporte.totalUnidades).toBe(2);
    });

    it('respeta el rango y devuelve vacio sin dispensaciones', async () => {
      const reporte = await service.consumo({
        desde: diasDesdeHoy(-5),
        hasta: diasDesdeHoy(-1),
      });

      expect(reporte).toEqual({
        desde: diasDesdeHoy(-5),
        hasta: diasDesdeHoy(-1),
        totalUnidades: 0,
        totalVentas: 0,
        detalle: [],
      });
    });
  });

  it('vencimientos devuelve el lote sin anidar el medicamento y con su perdida', async () => {
    const [vencido] = (await service.vencimientos()).lotes;

    expect(vencido.lote).toMatchObject({
      id: 4,
      numeroLote: 'MLX-050',
      medicamentoId: 3,
      cantidad: 4,
    });
    expect(vencido.lote).not.toHaveProperty('medicamento');
    expect(vencido.medicamento.nombre).toBe('Meloxicam 1.5 mg/ml');
    expect(vencido.medicamento.categorias).toHaveLength(1);
    expect(vencido.perdida).toBe(4 * 32000);
  });

  describe('stock valorizado', () => {
    it('valora el stock disponible y no cuenta los lotes vencidos', async () => {
      const { items, valorTotal } = await service.stock();

      expect(items).toEqual([
        {
          medicamento: { id: 4, nombre: 'Desparasitante Albendazol' },
          unidades: 25,
          valor: 25 * 45000,
        },
        {
          medicamento: { id: 2, nombre: 'Vacuna antirrabica' },
          unidades: 42,
          valor: 42 * 25000,
        },
        {
          medicamento: { id: 3, nombre: 'Meloxicam 1.5 mg/ml' },
          unidades: 10,
          valor: 10 * 32000,
        },
        {
          medicamento: { id: 1, nombre: 'Amoxicilina 250 mg' },
          unidades: 15,
          valor: 15 * 18000,
        },
      ]);
      expect(valorTotal).toBe(1125000 + 1050000 + 320000 + 270000);
    });

    it('omite los medicamentos sin stock y refleja las dispensaciones', async () => {
      await dispensacionService.dispensar({
        medicamentoId: 4,
        cantidad: 25,
        mascota: 'Lola',
        veterinario: 'Dr. Carlos Erazo',
      });

      const { items, valorTotal } = await service.stock();

      expect(items.map((i) => i.medicamento.id)).toEqual([2, 3, 1]);
      expect(valorTotal).toBe(1050000 + 320000 + 270000);
    });
  });

  describe('proveedores', () => {
    it('suma lotes, unidades recibidas y valor por proveedor', async () => {
      const data = await service.proveedores({});

      // Agrovet: lotes 1 (40 amox), 4 (10 melox), 5 (10 melox), 6 (25 albendazol)
      // Pet Salud: lotes 2 (30 vacuna) y 3 (12 vacuna)
      expect(data).toEqual([
        {
          proveedor: { id: 1, nombre: 'Distribuidora Agrovet Narino' },
          lotes: 4,
          unidades: 85,
          valor: 40 * 18000 + 20 * 32000 + 25 * 45000,
        },
        {
          proveedor: { id: 2, nombre: 'Laboratorios Pet Salud' },
          lotes: 2,
          unidades: 42,
          valor: 42 * 25000,
        },
      ]);
    });

    it('filtra por fecha de ingreso del lote', async () => {
      const data = await service.proveedores({
        desde: diasDesdeHoy(-35),
        hasta: diasDesdeHoy(-5),
      });

      // Ingresos: lote 5 (-20, Agrovet) y lote 6 (-30, Agrovet) y lote 3 (-10, Pet Salud)
      expect(data.map((p) => [p.proveedor.id, p.lotes, p.unidades])).toEqual([
        [1, 2, 35],
        [2, 1, 12],
      ]);
    });

    it('devuelve vacio sin lotes en el rango y 400 si el rango es invalido', async () => {
      expect(await service.proveedores({ desde: diasDesdeHoy(1) })).toEqual([]);
      await expect(
        service.proveedores({ desde: '2030-01-02', hasta: '2030-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
