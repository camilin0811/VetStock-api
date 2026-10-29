import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { InventarioService } from '../inventario/inventario.service';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { DispensacionService } from './dispensacion.service';

describe('DispensacionService', () => {
  let service: DispensacionService;
  let inventarioService: InventarioService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: importacionesBdPrueba(),
      providers: [
        DispensacionService,
        InventarioService,
        MedicamentoService,
        ProveedorService,
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
      { loteId: 2, numeroLote: 'VAR-101', cantidad: 30 },
      { loteId: 3, numeroLote: 'VAR-102', cantidad: 5 },
    ]);
    expect((await inventarioService.obtenerInventario(2)).stockDisponible).toBe(
      7,
    );
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
});
