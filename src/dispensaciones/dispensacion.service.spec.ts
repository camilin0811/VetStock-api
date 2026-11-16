import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { DataSource, EntityManager } from 'typeorm';
import { bloqueoPesimista } from '../common/bloqueo';
import { Lote } from '../inventario/entities/lote.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { Movimiento } from '../inventario/entities/movimiento.entity';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { diasDesdeHoy } from '../common/fechas';
import { InventarioModule } from '../inventario/inventario.module';
import { InventarioService } from '../inventario/inventario.service';
import { DispensacionesModule } from './dispensaciones.module';
import { DispensacionService } from './dispensacion.service';

describe('DispensacionService', () => {
  let service: DispensacionService;
  let inventarioService: InventarioService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...importacionesBdPrueba(),
        DispensacionesModule,
        InventarioModule,
      ],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<DispensacionService>(DispensacionService);
    inventarioService = testingModule.get<InventarioService>(InventarioService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('descuenta primero del lote que vence antes (FEFO)', async () => {
    const resultado = await service.dispensar({
      medicamentoId: 2,
      cantidad: 35,
      mascota: 'Toby',
      veterinario: 'Dra. Paola Rosero',
    });

    expect(resultado.data.lotesUsados).toEqual([
      {
        loteId: 2,
        numeroLote: 'VAR-101',
        cantidad: 30,
        fechaVencimiento: diasDesdeHoy(20),
      },
      {
        loteId: 3,
        numeroLote: 'VAR-102',
        cantidad: 5,
        fechaVencimiento: diasDesdeHoy(300),
      },
    ]);
    expect((await inventarioService.obtenerInventario(2)).stockDisponible).toBe(
      7,
    );
  });

  it('guarda la relacion con el medicamento y la expone al consultar', async () => {
    const { data } = await service.dispensar({
      medicamentoId: 2,
      cantidad: 1,
      mascota: 'Toby',
      veterinario: 'Dra. Paola Rosero',
    });

    const dispensacion = await service.obtener(data.id);

    expect(dispensacion.medicamentoId).toBe(2);
    expect(dispensacion.medicamento.nombre).toBe('Vacuna antirrabica');
  });

  it('no dispensa de lotes vencidos', async () => {
    const resultado = await service.dispensar({
      medicamentoId: 3,
      cantidad: 2,
      mascota: 'Michi',
      veterinario: 'Dr. Carlos Erazo',
      formula: 'F-2001',
    });

    expect(resultado.data.lotesUsados[0].numeroLote).toBe('MLX-051');
  });

  it('lanza error si falta la formula', async () => {
    await expect(
      service.dispensar({
        medicamentoId: 1,
        cantidad: 1,
        mascota: 'Max',
        veterinario: 'Dra. Paola Rosero',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza error si no hay stock suficiente', async () => {
    await expect(
      service.dispensar({
        medicamentoId: 4,
        cantidad: 500,
        mascota: 'Lola',
        veterinario: 'Dr. Carlos Erazo',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza error si la dispensacion no existe', async () => {
    await expect(service.obtener(999)).rejects.toThrow(NotFoundException);
  });

  describe('usuario y estado', () => {
    it('registra el usuario que dispensa y expone solo id y nombre', async () => {
      const usuario = await testingModule
        .get(DataSource)
        .getRepository(Usuario)
        .findOneByOrFail({ id: 2 });

      const { data } = await service.dispensar(
        {
          medicamentoId: 2,
          cantidad: 1,
          mascota: 'Toby',
          veterinario: 'Dra. Paola Rosero',
        },
        usuario,
      );

      expect(data.usuario).toEqual({ id: 2, nombre: 'Paola' });
      expect(data.estado).toBe('ACTIVA');
      expect(data.formula).toBeNull();
      const guardada = await service.obtener(data.id);
      expect(guardada.usuario).toEqual({ id: 2, nombre: 'Paola' });
      expect(guardada.usuarioId).toBe(2);
    });

    it('sin usuario queda null y las dispensaciones previas son ACTIVA', async () => {
      const { data } = await service.dispensar({
        medicamentoId: 2,
        cantidad: 1,
        mascota: 'Toby',
        veterinario: 'Dra. Paola Rosero',
      });

      expect(data.usuario).toBeNull();
      expect((await service.obtener(1)).estado).toBe('ACTIVA');
      expect((await service.obtener(1)).usuario).toBeNull();
    });
  });

  describe('kardex', () => {
    it('crea un movimiento SALIDA por cada lote usado, con el usuario', async () => {
      const dataSource = testingModule.get(DataSource);
      const usuario = await dataSource
        .getRepository(Usuario)
        .findOneByOrFail({ id: 2 });

      const { data } = await service.dispensar(
        {
          medicamentoId: 2,
          cantidad: 35,
          mascota: 'Toby',
          veterinario: 'Dra. Paola Rosero',
        },
        usuario,
      );

      const movimientos = await dataSource.getRepository(Movimiento).find({
        where: { tipo: 'SALIDA', medicamentoId: 2 },
        order: { id: 'ASC' },
      });
      expect(
        movimientos.map((m) => [m.loteId, m.cantidad, m.usuarioId, m.detalle]),
      ).toEqual([
        [2, 30, 2, `Dispensacion ${data.id} - Toby`],
        [3, 5, 2, `Dispensacion ${data.id} - Toby`],
      ]);
    });

    it('no deja movimientos si la dispensacion falla', async () => {
      const dataSource = testingModule.get(DataSource);
      const antes = await dataSource.getRepository(Movimiento).count();

      await expect(
        service.dispensar({
          medicamentoId: 4,
          cantidad: 500,
          mascota: 'Lola',
          veterinario: 'Dr. Carlos Erazo',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(await dataSource.getRepository(Movimiento).count()).toBe(antes);
    });
  });

  describe('bloqueo pesimista', () => {
    it('en sqlite no pide bloqueo (el driver no lo soporta)', async () => {
      const dataSource = testingModule.get(DataSource);

      await dataSource.transaction(async (manager) => {
        expect(bloqueoPesimista(manager)).toBeUndefined();
      });
    });

    it('en otros drivers pide pessimistic_write', () => {
      const manager = {
        connection: { options: { type: 'postgres' } },
      } as unknown as EntityManager;

      expect(bloqueoPesimista(manager)).toEqual({ mode: 'pessimistic_write' });
    });

    it('el FEFO consulta los lotes con la opcion de bloqueo de la transaccion', async () => {
      const espia = jest.spyOn(EntityManager.prototype, 'find');

      await service.dispensar({
        medicamentoId: 2,
        cantidad: 1,
        mascota: 'Toby',
        veterinario: 'Dra. Paola Rosero',
      });

      const llamada = espia.mock.calls.find(([entidad]) => entidad === Lote);
      expect(llamada?.[1]).toHaveProperty('lock');
      espia.mockRestore();
    });
  });
});
