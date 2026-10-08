import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { diasDesdeHoy, hoy } from '../common/fechas';
import { InventarioService } from '../inventario/inventario.service';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import {
  DispensacionDto,
  DispensacionRequestDto,
  LoteUsadoDto,
} from './dispensacion.dto';

@Injectable()
export class DispensacionService {
  private dispensaciones: DispensacionDto[] = [
    {
      id: '1',
      medicamentoId: '1',
      cantidad: 25,
      mascota: 'Max',
      veterinario: 'Dra. Paola Rosero',
      formula: 'F-1001',
      fecha: diasDesdeHoy(-30),
      total: 450000,
      lotesUsados: [{ loteId: '1', numeroLote: 'AMX-001', cantidad: 25 }],
    },
    {
      id: '2',
      medicamentoId: '3',
      cantidad: 6,
      mascota: 'Luna',
      veterinario: 'Dr. Carlos Erazo',
      formula: 'F-0950',
      fecha: diasDesdeHoy(-100),
      total: 192000,
      lotesUsados: [{ loteId: '4', numeroLote: 'MLX-050', cantidad: 6 }],
    },
  ];

  constructor(
    private readonly medicamentoService: MedicamentoService,
    private readonly inventarioService: InventarioService,
  ) {}

  dispensar(datos: DispensacionRequestDto) {
    const medicamento = this.medicamentoService.obtener(datos.medicamentoId);

    if (medicamento.requiereFormula && datos.formula === undefined) {
      throw new BadRequestException(
        `El medicamento ${medicamento.nombre} requiere formula del veterinario`,
      );
    }

    const lotes = this.inventarioService.lotesDisponibles(medicamento.id);
    const disponible = lotes.reduce((total, lote) => total + lote.cantidad, 0);
    if (disponible < datos.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente: hay ${disponible} unidades disponibles de ${medicamento.nombre}`,
      );
    }

    // FEFO: se descuenta primero del lote que vence antes
    const lotesUsados: LoteUsadoDto[] = [];
    let pendiente = datos.cantidad;
    for (const lote of lotes) {
      if (pendiente === 0) {
        break;
      }

      const cantidad = Math.min(lote.cantidad, pendiente);
      lote.cantidad -= cantidad;
      pendiente -= cantidad;
      lotesUsados.push({
        loteId: lote.id,
        numeroLote: lote.numeroLote,
        cantidad,
      });
    }

    const nuevaDispensacion: DispensacionDto = {
      id: `${new Date().getTime()}`,
      ...datos,
      fecha: hoy(),
      total: medicamento.precio * datos.cantidad,
      lotesUsados,
    };
    this.dispensaciones.push(nuevaDispensacion);

    return {
      message: 'Dispensacion registrada correctamente',
      data: nuevaDispensacion,
    };
  }

  listar() {
    return this.dispensaciones;
  }

  obtener(id: string) {
    const dispensacion = this.dispensaciones.find(
      (dispensacion) => dispensacion.id === id,
    );
    if (dispensacion === undefined) {
      throw new NotFoundException(`Dispensacion con ID ${id} no existe`);
    }

    return dispensacion;
  }
}
