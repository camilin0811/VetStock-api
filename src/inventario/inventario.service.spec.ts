import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { Usuario } from '../auth/entities/usuario.entity';
import { diasDesdeHoy } from '../common/fechas';
import { AlertaService } from './alerta.service';
import { InventarioModule } from './inventario.module';
import { InventarioService } from './inventario.service';
import { MovimientoService } from './movimiento.service';

describe('InventarioService', () => {
  let service: InventarioService;
  let alertaService: AlertaService;
  let movimientoService: MovimientoService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), InventarioModule],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<InventarioService>(InventarioService);
    alertaService = testingModule.get<AlertaService>(AlertaService);
    movimientoService = testingModule.get(MovimientoService);
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
    const tipos = (await alertaService.generar()).data.map(
      (alerta) => alerta.tipo,
    );

    expect(tipos).toContain('STOCK_BAJO');
    expect(tipos).toContain('POR_VENCER');
    expect(tipos).toContain('VENCIDO');
  });

  describe('kardex', () => {
    it('registrar un lote crea un movimiento de ENTRADA con el usuario', async () => {
      const usuario = await testingModule
        .get(DataSource)
        .getRepository(Usuario)
        .findOneByOrFail({ id: 3 });

      const { data: lote } = await service.registrarLote(
        {
          medicamentoId: 4,
          proveedorId: 1,
          numeroLote: 'ALB-301',
          cantidad: 10,
          fechaVencimiento: diasDesdeHoy(365),
        },
        usuario,
      );

      const { data } = await movimientoService.listar({ medicamentoId: 4 });
      expect(data[0]).toMatchObject({
        tipo: 'ENTRADA',
        cantidad: 10,
        loteId: lote.id,
        medicamentoId: 4,
        numeroLote: 'ALB-301',
        usuario: { id: 3, nombre: 'Camila' },
      });
      expect(data[0].medicamento.nombre).toBe('Desparasitante Albendazol');
      expect(data[0].fecha).toBeInstanceOf(Date);
    });

    it('un lote rechazado no deja movimientos', async () => {
      const antes = (await movimientoService.listar()).count;

      await expect(
        service.registrarLote({
          medicamentoId: 1,
          proveedorId: 1,
          numeroLote: 'AMX-001',
          cantidad: 5,
          fechaVencimiento: diasDesdeHoy(100),
        }),
      ).rejects.toThrow(ConflictException);

      expect((await movimientoService.listar()).count).toBe(antes);
    });

    it('lista del mas reciente al mas antiguo y filtra por medicamento y tipo', async () => {
      const todos = await movimientoService.listar();
      expect(todos.count).toBe(8);
      expect(todos.data[0].id).toBeGreaterThan(todos.data[7].id);

      const salidasDeMeloxicam = await movimientoService.listar({
        medicamentoId: 3,
        tipo: 'SALIDA',
      });
      expect(salidasDeMeloxicam.count).toBe(1);
      expect(salidasDeMeloxicam.data[0].usuario).toBeNull();
      expect(salidasDeMeloxicam.data[0].numeroLote).toBe('MLX-050');
    });
  });
});
