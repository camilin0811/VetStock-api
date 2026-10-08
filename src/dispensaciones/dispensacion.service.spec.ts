import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InventarioService } from '../inventario/inventario.service';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { DispensacionService } from './dispensacion.service';

describe('DispensacionService', () => {
  let service: DispensacionService;
  let inventarioService: InventarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispensacionService,
        InventarioService,
        MedicamentoService,
        ProveedorService,
      ],
    }).compile();

    service = module.get<DispensacionService>(DispensacionService);
    inventarioService = module.get<InventarioService>(InventarioService);
  });

  it('descuenta primero del lote que vence antes (FEFO)', () => {
    const resultado = service.dispensar({
      medicamentoId: '2',
      cantidad: 35,
      mascota: 'Toby',
      veterinario: 'Dra. Paola Rosero',
    });

    expect(resultado.data.lotesUsados).toEqual([
      { loteId: '2', numeroLote: 'VAR-101', cantidad: 30 },
      { loteId: '3', numeroLote: 'VAR-102', cantidad: 5 },
    ]);
    expect(inventarioService.obtenerInventario('2').stockDisponible).toBe(7);
  });

  it('no dispensa de lotes vencidos', () => {
    const resultado = service.dispensar({
      medicamentoId: '3',
      cantidad: 2,
      mascota: 'Michi',
      veterinario: 'Dr. Carlos Erazo',
      formula: 'F-2001',
    });

    expect(resultado.data.lotesUsados[0].numeroLote).toBe('MLX-051');
  });

  it('lanza error si falta la formula', () => {
    expect(() =>
      service.dispensar({
        medicamentoId: '1',
        cantidad: 1,
        mascota: 'Max',
        veterinario: 'Dra. Paola Rosero',
      }),
    ).toThrow(BadRequestException);
  });

  it('lanza error si no hay stock suficiente', () => {
    expect(() =>
      service.dispensar({
        medicamentoId: '4',
        cantidad: 500,
        mascota: 'Lola',
        veterinario: 'Dr. Carlos Erazo',
      }),
    ).toThrow(BadRequestException);
  });

  it('lanza error si la dispensacion no existe', () => {
    expect(() => service.obtener('999')).toThrow(NotFoundException);
  });
});
