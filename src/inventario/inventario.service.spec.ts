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
import { MedicamentoService } from '../medicamentos/medicamento.service';
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

  describe('listarInventario', () => {
    it('agrega disponible y vencido de todos los medicamentos', async () => {
      const { data, count } = await service.listarInventario();

      expect(count).toBe(4);
      const porId = new Map(data.map((item) => [item.medicamento.id, item]));
      expect(porId.get(1)).toMatchObject({ disponible: 15, vencido: 0 });
      expect(porId.get(2)).toMatchObject({ disponible: 42, vencido: 0 });
      expect(porId.get(3)).toMatchObject({ disponible: 10, vencido: 4 });
      expect(porId.get(4)).toMatchObject({ disponible: 25, vencido: 0 });
    });

    it('calcula el estado segun el stock minimo', async () => {
      const { data } = await service.listarInventario();
      const estado = (id: number) =>
        data.find((item) => item.medicamento.id === id)?.estado;

      expect(estado(1)).toBe('STOCK_BAJO'); // 15 < minimo 20
      expect(estado(2)).toBe('OK');
      expect(estado(3)).toBe('OK');
    });

    it('marca SIN_STOCK a un medicamento sin lotes y coincide con obtenerInventario', async () => {
      const { data: nuevo } = await testingModule
        .get(MedicamentoService)
        .crear({
          nombre: 'Suero oral',
          presentacion: 'Sobre 20 g',
          especie: 'general',
          precio: 1500,
          stockMinimo: 2,
          requiereFormula: false,
        });

      const { data } = await service.listarInventario();
      expect(data.find((i) => i.medicamento.id === nuevo.id)).toMatchObject({
        disponible: 0,
        vencido: 0,
        estado: 'SIN_STOCK',
      });

      for (const item of data) {
        const detalle = await service.obtenerInventario(item.medicamento.id);
        expect(item.disponible).toBe(detalle.stockDisponible);
        expect(item.vencido).toBe(detalle.stockVencido);
      }
    });

    it('un lote que vence hoy cuenta como vencido', async () => {
      await testingModule
        .get(DataSource)
        .query('UPDATE lote SET fecha_vencimiento = ? WHERE id = 6', [
          diasDesdeHoy(0),
        ]);

      const { data } = await service.listarInventario();

      expect(data.find((i) => i.medicamento.id === 4)).toMatchObject({
        disponible: 0,
        vencido: 25,
        estado: 'SIN_STOCK',
      });
    });
  });

  describe('actualizarLote', () => {
    it('corrige numero de lote, vencimiento y proveedor sin tocar cantidades', async () => {
      const { data } = await service.actualizarLote(1, {
        numeroLote: 'AMX-001B',
        fechaVencimiento: '2099-06-30T00:00:00.000Z',
        proveedorId: 2,
      });

      expect(data).toMatchObject({
        id: 1,
        numeroLote: 'AMX-001B',
        fechaVencimiento: '2099-06-30',
        proveedorId: 2,
        cantidad: 15,
        cantidadInicial: 40,
        medicamentoId: 1,
      });
      expect(data.proveedor.nombre).toBe('Laboratorios Pet Salud');
      expect((await service.obtenerLote(1)).proveedorId).toBe(2);
    });

    it('acepta una actualizacion parcial y conservar su propio numero', async () => {
      const { data } = await service.actualizarLote(1, {
        numeroLote: 'AMX-001',
      });

      expect(data.numeroLote).toBe('AMX-001');
      expect(data.proveedorId).toBe(1);
    });

    it('lanza 409 si el numero ya existe en el mismo medicamento', async () => {
      await expect(
        service.actualizarLote(2, { numeroLote: 'VAR-102' }),
      ).rejects.toThrow(ConflictException);
    });

    it('permite el mismo numero en otro medicamento', async () => {
      await expect(
        service.actualizarLote(1, { numeroLote: 'VAR-102' }),
      ).resolves.toBeDefined();
    });

    it('lanza 404 si el lote o el proveedor no existen', async () => {
      await expect(
        service.actualizarLote(999, { numeroLote: 'X' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.actualizarLote(1, { proveedorId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
