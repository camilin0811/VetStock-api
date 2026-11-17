import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { Lote } from '../inventario/entities/lote.entity';
import { Proveedor } from './entities/proveedor.entity';
import { ProveedoresModule } from './proveedores.module';
import { ProveedorService } from './proveedor.service';

describe('ProveedorService', () => {
  let service: ProveedorService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), ProveedoresModule],
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

  it('guarda el correo opcional y por defecto es null', async () => {
    const sin = await service.crear({
      nombre: 'Vet Insumos del Sur',
      nit: '901555444-3',
      telefono: '3205554444',
      ciudad: 'Ipiales',
    });
    const con = await service.crear({
      nombre: 'Agro Norte',
      nit: '901666555-1',
      telefono: '3205554445',
      ciudad: 'Ipiales',
      correo: 'ventas@agronorte.com',
    });

    expect((await service.obtener(sin.data.id)).correo).toBeNull();
    expect((await service.obtener(con.data.id)).correo).toBe(
      'ventas@agronorte.com',
    );
  });

  it('actualiza parcialmente y permite conservar su propio NIT', async () => {
    const { data } = await service.actualizar(1, {
      ciudad: 'Ipiales',
      nit: '900123456-1',
      correo: 'info@agrovet.com',
    });

    expect(data.ciudad).toBe('Ipiales');
    expect(data.correo).toBe('info@agrovet.com');
    expect(data.nombre).toBe('Distribuidora Agrovet Narino');
  });

  it('lanza error al actualizar con el NIT de otro proveedor o inexistente', async () => {
    await expect(service.actualizar(1, { nit: '800987654-2' })).rejects.toThrow(
      ConflictException,
    );
    await expect(service.actualizar(999, { ciudad: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('elimina un proveedor sin lotes', async () => {
    const { data } = await service.crear({
      nombre: 'Vet Insumos del Sur',
      nit: '901555444-3',
      telefono: '3205554444',
      ciudad: 'Ipiales',
    });

    await service.eliminar(data.id);

    await expect(service.obtener(data.id)).rejects.toThrow(NotFoundException);
  });

  it('lanza 409 al eliminar un proveedor con lotes y 404 si no existe', async () => {
    await expect(service.eliminar(1)).rejects.toThrow(ConflictException);
    await expect(service.eliminar(999)).rejects.toThrow(NotFoundException);
  });
});

describe('ProveedorService con repositorio simulado', () => {
  let service: ProveedorService;
  let testingModule: TestingModule;
  const proveedor = { id: 7, nombre: 'Simulado', nit: '1-1' };
  const repositorio = {
    findOneBy: jest.fn(),
    create: jest.fn((datos: object) => datos),
    save: jest.fn(async (datos: object) => ({ id: 7, ...datos })),
    find: jest.fn(async () => [proveedor]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    testingModule = await Test.createTestingModule({
      providers: [
        ProveedorService,
        { provide: getRepositoryToken(Proveedor), useValue: repositorio },
        { provide: getRepositoryToken(Lote), useValue: {} },
      ],
    }).compile();

    service = testingModule.get<ProveedorService>(ProveedorService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('lanza NotFoundException cuando findOneBy devuelve null', async () => {
    repositorio.findOneBy.mockResolvedValue(null);

    await expect(service.obtener(7)).rejects.toThrow(NotFoundException);
  });

  it('espera el save antes de responder al crear', async () => {
    repositorio.findOneBy.mockResolvedValue(null);

    const resultado = await service.crear({
      nombre: 'Nuevo',
      nit: '2-2',
      telefono: '300',
      ciudad: 'Pasto',
    });

    expect(repositorio.save).toHaveBeenCalledTimes(1);
    expect(resultado.data.id).toBe(7);
  });

  it('lista con count', async () => {
    const resultado = await service.listar();

    expect(resultado.count).toBe(1);
    expect(resultado.data).toEqual([proveedor]);
  });
});
