import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { diasDesdeHoy } from '../common/fechas';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { AlertaService } from './alerta.service';
import { InventarioService } from './inventario.service';

describe('InventarioService', () => {
  let service: InventarioService;
  let alertaService: AlertaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioService,
        AlertaService,
        MedicamentoService,
        ProveedorService,
      ],
    }).compile();

    service = module.get<InventarioService>(InventarioService);
    alertaService = module.get<AlertaService>(AlertaService);
  });

  it('registra un lote y suma al stock disponible', () => {
    const antes = service.obtenerInventario('4').stockDisponible;

    service.registrarLote({
      medicamentoId: '4',
      proveedorId: '1',
      numeroLote: 'ALB-301',
      cantidad: 10,
      fechaVencimiento: diasDesdeHoy(365),
    });

    expect(service.obtenerInventario('4').stockDisponible).toBe(antes + 10);
  });

  it('no cuenta los lotes vencidos como stock disponible', () => {
    const inventario = service.obtenerInventario('3');

    expect(inventario.stockDisponible).toBe(10);
    expect(inventario.stockVencido).toBe(4);
  });

  it('lanza error si el lote ya esta vencido', () => {
    expect(() =>
      service.registrarLote({
        medicamentoId: '1',
        proveedorId: '1',
        numeroLote: 'AMX-999',
        cantidad: 5,
        fechaVencimiento: diasDesdeHoy(-1),
      }),
    ).toThrow(BadRequestException);
  });

  it('lanza error si el numero de lote se repite', () => {
    expect(() =>
      service.registrarLote({
        medicamentoId: '1',
        proveedorId: '1',
        numeroLote: 'AMX-001',
        cantidad: 5,
        fechaVencimiento: diasDesdeHoy(100),
      }),
    ).toThrow(ConflictException);
  });

  it('lanza error si el medicamento no existe', () => {
    expect(() => service.obtenerInventario('999')).toThrow(NotFoundException);
  });

  it('genera alertas de stock bajo, por vencer y vencido', () => {
    const tipos = alertaService.generar().map((alerta) => alerta.tipo);

    expect(tipos).toContain('STOCK_BAJO');
    expect(tipos).toContain('POR_VENCER');
    expect(tipos).toContain('VENCIDO');
  });
});
