import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { DispensacionService } from '../dispensaciones/dispensacion.service';
import { InventarioService } from '../inventario/inventario.service';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { ReporteService } from './reporte.service';

describe('ReporteService', () => {
  let service: ReporteService;
  let dispensacionService: DispensacionService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: importacionesBdPrueba(),
      providers: [
        ReporteService,
        DispensacionService,
        InventarioService,
        MedicamentoService,
        ProveedorService,
      ],
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
});
