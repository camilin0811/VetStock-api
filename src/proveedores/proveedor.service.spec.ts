import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProveedorService } from './proveedor.service';

describe('ProveedorService', () => {
  let service: ProveedorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProveedorService],
    }).compile();

    service = module.get<ProveedorService>(ProveedorService);
  });

  it('registra un proveedor nuevo', () => {
    const resultado = service.crear({
      nombre: 'Vet Insumos del Sur',
      nit: '901555444-3',
      telefono: '3205554444',
      ciudad: 'Ipiales',
    });

    expect(resultado.data.id).toBeDefined();
  });

  it('lanza error si el NIT ya esta registrado', () => {
    expect(() =>
      service.crear({
        nombre: 'Otro nombre',
        nit: '900123456-1',
        telefono: '3000000000',
        ciudad: 'Pasto',
      }),
    ).toThrow(ConflictException);
  });

  it('lanza error si el proveedor no existe', () => {
    expect(() => service.obtener('999')).toThrow(NotFoundException);
  });
});
