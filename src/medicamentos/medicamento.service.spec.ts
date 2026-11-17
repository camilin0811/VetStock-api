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
});
