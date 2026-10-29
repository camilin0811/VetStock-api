import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { diasDesdeHoy } from '../common/fechas';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { AlertaService } from './alerta.service';
import { InventarioService } from './inventario.service';

describe('InventarioService', () => {
  let service: InventarioService;
  let alertaService: AlertaService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: importacionesBdPrueba(),
      providers: [
        InventarioService,
        AlertaService,
        MedicamentoService,
        ProveedorService,
      ],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<InventarioService>(InventarioService);
    alertaService = testingModule.get<AlertaService>(AlertaService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('registra un lote y suma al stock disponible', async () => {
    const antes = (await service.obtenerInventario(4)).stockDisponible;

    await service.registrarLote({
      medicamentoId: 4,
      proveedorId: 1,
      numeroLote: 'ALB-301',
      cantidad: 10,
      fechaVencimiento: diasDesdeHoy(365),
    });

    expect((await service.obtenerInventario(4)).stockDisponible).toBe(
      antes + 10,
    );
  });

  it('no cuenta los lotes vencidos como stock disponible', async () => {
    const inventario = await service.obtenerInventario(3);

    expect(inventario.stockDisponible).toBe(10);
    expect(inventario.stockVencido).toBe(4);
  });

  it('lanza error si el lote ya esta vencido', async () => {
    await expect(
      service.registrarLote({
        medicamentoId: 1,
        proveedorId: 1,
        numeroLote: 'AMX-999',
        cantidad: 5,
        fechaVencimiento: diasDesdeHoy(-1),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza error si el numero de lote se repite', async () => {
    await expect(
      service.registrarLote({
        medicamentoId: 1,
        proveedorId: 1,
        numeroLote: 'AMX-001',
        cantidad: 5,
        fechaVencimiento: diasDesdeHoy(100),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lanza error si el medicamento no existe', async () => {
    await expect(service.obtenerInventario(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('genera alertas de stock bajo, por vencer y vencido', async () => {
    const tipos = (await alertaService.generar()).map((alerta) => alerta.tipo);

    expect(tipos).toContain('STOCK_BAJO');
    expect(tipos).toContain('POR_VENCER');
    expect(tipos).toContain('VENCIDO');
  });
});
