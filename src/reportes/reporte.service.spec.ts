import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DispensacionService } from '../dispensaciones/dispensacion.service';
import { InventarioService } from '../inventario/inventario.service';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { ReporteService } from './reporte.service';

describe('ReporteService', () => {
  let service: ReporteService;
  let dispensacionService: DispensacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReporteService,
        DispensacionService,
        InventarioService,
        MedicamentoService,
        ProveedorService,
      ],
    }).compile();

    service = module.get<ReporteService>(ReporteService);
    dispensacionService = module.get<DispensacionService>(DispensacionService);
  });

  it('suma el consumo de los ultimos 30 dias por medicamento', () => {
    dispensacionService.dispensar({
      medicamentoId: '1',
      cantidad: 5,
      mascota: 'Max',
      veterinario: 'Dra. Paola Rosero',
      formula: 'F-1002',
    });

    const reporte = service.consumo({});

    expect(reporte.detalle).toHaveLength(1);
    expect(reporte.detalle[0].unidades).toBe(30);
    expect(reporte.totalVentas).toBe(30 * 18000);
  });

  it('lanza error si el rango de fechas es invalido', () => {
    expect(() =>
      service.consumo({ desde: '2026-12-31', hasta: '2026-01-01' }),
    ).toThrow(BadRequestException);
  });

  it('calcula la perdida por lotes vencidos', () => {
    const reporte = service.vencimientos();

    expect(reporte.lotes).toHaveLength(1);
    expect(reporte.totalPerdida).toBe(4 * 32000);
  });
});
