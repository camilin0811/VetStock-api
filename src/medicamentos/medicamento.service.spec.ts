import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { MedicamentoService } from './medicamento.service';

describe('MedicamentoService', () => {
  let service: MedicamentoService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: importacionesBdPrueba(),
      providers: [MedicamentoService],
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
    expect(await service.listar()).toContainEqual(resultado.data);
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

  it('lanza error si el medicamento no existe', async () => {
    await expect(service.obtener(999)).rejects.toThrow(NotFoundException);
  });
});
