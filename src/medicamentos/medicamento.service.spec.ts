import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { MedicamentosModule } from './medicamentos.module';
import { MedicamentoService } from './medicamento.service';

describe('MedicamentoService', () => {
  let service: MedicamentoService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), MedicamentosModule],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<MedicamentoService>(MedicamentoService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('registra un medicamento nuevo', async () => {
    const resultado = await service.crear({
      nombre: 'Ivermectina 1%',
      presentacion: 'Frasco 50 ml',
      especie: 'bovino',
      precio: 38000,
      stockMinimo: 6,
      requiereFormula: false,
    });

    expect(resultado.data.id).toBeDefined();
    expect((await service.listar()).data).toContainEqual(resultado.data);
  });

  it('guarda el precio con decimales y lo devuelve como numero', async () => {
    const { data } = await service.crear({
      nombre: 'Suero oral',
      presentacion: 'Sobre 20 g',
      especie: 'general',
      precio: 1234.5,
      stockMinimo: 2,
      requiereFormula: false,
    });

    const medicamento = await service.obtener(data.id);

    expect(medicamento.precio).toBe(1234.5);
  });

  it('lanza error si el medicamento ya existe', async () => {
    await expect(
      service.crear({
        nombre: 'amoxicilina 250 mg',
        presentacion: 'Tabletas x 10',
        especie: 'canino',
        precio: 18000,
        stockMinimo: 20,
        requiereFormula: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lanza 409 al renombrar con el nombre de otro medicamento', async () => {
    const otro = (await service.obtener(2)).nombre;

    await expect(
      service.actualizar(1, { nombre: otro.toUpperCase() }),
    ).rejects.toThrow(ConflictException);
  });

  it('permite actualizar conservando su propio nombre', async () => {
    const propio = (await service.obtener(1)).nombre;

    const { data } = await service.actualizar(1, {
      nombre: propio.toUpperCase(),
    });
    expect(data.nombre).toBe(propio.toUpperCase());
  });

  it('actualiza el stock minimo de un medicamento', async () => {
    const resultado = await service.actualizar(1, { stockMinimo: 30 });

    expect(resultado.data.stockMinimo).toBe(30);
  });

  it('incluye las categorias al consultar un medicamento', async () => {
    const medicamento = await service.obtener(2);

    expect(medicamento.categorias.map((c) => c.nombre)).toEqual(['Vacunas']);
    expect((await service.listar()).data[0].categorias).toHaveLength(1);
  });

  it('registra un medicamento con categorias por id', async () => {
    const { data } = await service.crear({
      nombre: 'Ivermectina 1%',
      presentacion: 'Frasco 50 ml',
      especie: 'bovino',
      precio: 38000,
      stockMinimo: 6,
      requiereFormula: false,
      categoriaIds: [4, 1, 4],
    });

    expect(data.categorias.map((c) => c.id)).toEqual([1, 4]);
    expect((await service.obtener(data.id)).categorias).toHaveLength(2);
  });

  it('lanza 404 si una categoria no existe al registrar', async () => {
    await expect(
      service.crear({
        nombre: 'Ivermectina 1%',
        presentacion: 'Frasco 50 ml',
        especie: 'bovino',
        precio: 38000,
        stockMinimo: 6,
        requiereFormula: false,
        categoriaIds: [1, 999],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('reemplaza las categorias al actualizar y las conserva si no se envian', async () => {
    await service.actualizar(1, { categoriaIds: [2, 3] });
    expect(
      (await service.obtener(1)).categorias.map((c) => c.id).sort(),
    ).toEqual([2, 3]);

    await service.actualizar(1, { stockMinimo: 12 });
    expect((await service.obtener(1)).categorias).toHaveLength(2);

    await service.actualizar(1, { categoriaIds: [] });
    expect((await service.obtener(1)).categorias).toHaveLength(0);
  });

  it('lanza 404 si una categoria no existe al actualizar', async () => {
    await expect(
      service.actualizar(1, { categoriaIds: [999] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lanza error si el medicamento no existe', async () => {
    await expect(service.obtener(999)).rejects.toThrow(NotFoundException);
  });

  describe('filtros de listar', () => {
    it('filtra por nombre sin importar mayusculas', async () => {
      const { data, count } = await service.listar({ q: 'VACUNA' });

      expect(count).toBe(1);
      expect(data[0].nombre).toBe('Vacuna antirrabica');
    });

    it('trata los comodines como texto literal', async () => {
      expect((await service.listar({ q: '%' })).count).toBe(0);
      expect((await service.listar({ q: '_' })).count).toBe(0);
    });

    it('filtra por especie', async () => {
      const { data } = await service.listar({ especie: 'canino' });

      expect(data.map((m) => m.id)).toEqual([1]);
    });

    it('filtra por categoria y conserva todas sus categorias', async () => {
      await service.actualizar(1, { categoriaIds: [1, 4] });

      const { data } = await service.listar({ categoriaId: 4 });

      expect(data.map((m) => m.id)).toEqual([1, 4]);
      expect(data[0].categorias.map((c) => c.id)).toEqual([1, 4]);
    });

    it('combina filtros y devuelve vacio si nada coincide', async () => {
      expect(
        (await service.listar({ especie: 'bovino', categoriaId: 4 })).count,
      ).toBe(1);
      expect(
        (await service.listar({ especie: 'felino', categoriaId: 4 })).count,
      ).toBe(0);
    });
  });

  describe('eliminar', () => {
    it('elimina un medicamento sin lotes ni dispensaciones', async () => {
      const { data } = await service.crear({
        nombre: 'Suero oral',
        presentacion: 'Sobre 20 g',
        especie: 'general',
        precio: 1500,
        stockMinimo: 2,
        requiereFormula: false,
        categoriaIds: [1],
      });

      const resultado = await service.eliminar(data.id);

      expect(resultado.message).toContain('eliminado');
      await expect(service.obtener(data.id)).rejects.toThrow(NotFoundException);
    });

    it('lanza 409 si tiene lotes', async () => {
      await expect(service.eliminar(1)).rejects.toThrow(ConflictException);
    });

    it('lanza 409 si solo tiene dispensaciones', async () => {
      const dataSource = testingModule.get(DataSource);
      await dataSource.query('DELETE FROM movimiento WHERE medicamento_id = 1');
      await dataSource.query('DELETE FROM lote WHERE medicamento_id = 1');

      await expect(service.eliminar(1)).rejects.toThrow(ConflictException);
    });

    it('lanza 404 si no existe', async () => {
      await expect(service.eliminar(999)).rejects.toThrow(NotFoundException);
    });
  });
});
