import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MedicamentoService } from './medicamento.service';

describe('MedicamentoService', () => {
  let service: MedicamentoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicamentoService],
    }).compile();

    service = module.get<MedicamentoService>(MedicamentoService);
  });

  it('registra un medicamento nuevo', () => {
    const resultado = service.crear({
      nombre: 'Ivermectina 1%',
      presentacion: 'Frasco 50 ml',
      especie: 'bovino',
      precio: 38000,
      stockMinimo: 6,
      requiereFormula: false,
    });

    expect(resultado.data.id).toBeDefined();
    expect(service.listar()).toContainEqual(resultado.data);
  });

  it('lanza error si el medicamento ya existe', () => {
    expect(() =>
      service.crear({
        nombre: 'amoxicilina 250 mg',
        presentacion: 'Tabletas x 10',
        especie: 'canino',
        precio: 18000,
        stockMinimo: 20,
        requiereFormula: true,
      }),
    ).toThrow(ConflictException);
  });

  it('actualiza el stock minimo de un medicamento', () => {
    const resultado = service.actualizar('1', { stockMinimo: 30 });

    expect(resultado.data.stockMinimo).toBe(30);
  });

  it('lanza error si el medicamento no existe', () => {
    expect(() => service.obtener('999')).toThrow(NotFoundException);
  });
});
