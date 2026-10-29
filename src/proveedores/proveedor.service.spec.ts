import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { ProveedorService } from './proveedor.service';

describe('ProveedorService', () => {
  let service: ProveedorService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: importacionesBdPrueba(),
      providers: [ProveedorService],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<ProveedorService>(ProveedorService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('registra un proveedor nuevo', async () => {
    const resultado = await service.crear({
      nombre: 'Vet Insumos del Sur',
      nit: '901555444-3',
      telefono: '3205554444',
      ciudad: 'Ipiales',
    });

    expect(resultado.data.id).toBeDefined();
  });

  it('lanza error si el NIT ya esta registrado', async () => {
    await expect(
      service.crear({
        nombre: 'Otro nombre',
        nit: '900123456-1',
        telefono: '3000000000',
        ciudad: 'Pasto',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lanza error si el proveedor no existe', async () => {
    await expect(service.obtener(999)).rejects.toThrow(NotFoundException);
  });
});
