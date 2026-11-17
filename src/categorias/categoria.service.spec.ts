import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { CategoriaService } from './categoria.service';
import { CategoriasModule } from './categorias.module';

describe('CategoriaService', () => {
  let service: CategoriaService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), CategoriasModule],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<CategoriaService>(CategoriaService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('lista las categorias con count', async () => {
    const resultado = await service.listar();

    expect(resultado.count).toBe(4);
    expect(resultado.data).toHaveLength(4);
  });

  it('registra una categoria nueva', async () => {
    const resultado = await service.crear({
      nombre: 'Suplementos',
      descripcion: 'Vitaminas y minerales',
    });

    expect(resultado.data.id).toBeDefined();
    expect((await service.obtener(resultado.data.id)).nombre).toBe(
      'Suplementos',
    );
  });

  it('lanza error si el nombre ya existe sin importar mayusculas', async () => {
    await expect(service.crear({ nombre: 'vacunas' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('actualiza una categoria y permite conservar su propio nombre', async () => {
    const resultado = await service.actualizar(1, {
      nombre: 'Antibioticos',
      descripcion: 'Uso sistemico',
    });

    expect(resultado.data.descripcion).toBe('Uso sistemico');
  });

  it('lanza error al renombrar a un nombre de otra categoria', async () => {
    await expect(service.actualizar(1, { nombre: 'Vacunas' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('elimina una categoria', async () => {
    await service.eliminar(4);

    await expect(service.obtener(4)).rejects.toThrow(NotFoundException);
  });

  it('lanza error si la categoria no existe', async () => {
    await expect(service.obtener(999)).rejects.toThrow(NotFoundException);
    await expect(service.eliminar(999)).rejects.toThrow(NotFoundException);
  });
});
