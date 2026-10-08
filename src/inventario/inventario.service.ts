import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { diasDesdeHoy, diasHasta, hoy } from '../common/fechas';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { InventarioDto, LoteDto, LoteRequestDto } from './lote.dto';

@Injectable()
export class InventarioService {
  private lotes: LoteDto[] = [
    {
      id: '1',
      medicamentoId: '1',
      proveedorId: '1',
      numeroLote: 'AMX-001',
      cantidadInicial: 40,
      cantidad: 15,
      fechaIngreso: diasDesdeHoy(-60),
      fechaVencimiento: diasDesdeHoy(200),
    },
    {
      id: '2',
      medicamentoId: '2',
      proveedorId: '2',
      numeroLote: 'VAR-101',
      cantidadInicial: 30,
      cantidad: 30,
      fechaIngreso: diasDesdeHoy(-90),
      fechaVencimiento: diasDesdeHoy(20),
    },
    {
      id: '3',
      medicamentoId: '2',
      proveedorId: '2',
      numeroLote: 'VAR-102',
      cantidadInicial: 12,
      cantidad: 12,
      fechaIngreso: diasDesdeHoy(-10),
      fechaVencimiento: diasDesdeHoy(300),
    },
    {
      id: '4',
      medicamentoId: '3',
      proveedorId: '1',
      numeroLote: 'MLX-050',
      cantidadInicial: 10,
      cantidad: 4,
      fechaIngreso: diasDesdeHoy(-400),
      fechaVencimiento: diasDesdeHoy(-10),
    },
    {
      id: '5',
      medicamentoId: '3',
      proveedorId: '1',
      numeroLote: 'MLX-051',
      cantidadInicial: 10,
      cantidad: 10,
      fechaIngreso: diasDesdeHoy(-20),
      fechaVencimiento: diasDesdeHoy(150),
    },
    {
      id: '6',
      medicamentoId: '4',
      proveedorId: '1',
      numeroLote: 'ALB-300',
      cantidadInicial: 25,
      cantidad: 25,
      fechaIngreso: diasDesdeHoy(-30),
      fechaVencimiento: diasDesdeHoy(400),
    },
  ];

  constructor(
    private readonly medicamentoService: MedicamentoService,
    private readonly proveedorService: ProveedorService,
  ) {}

  registrarLote(datos: LoteRequestDto) {
    this.medicamentoService.obtener(datos.medicamentoId);
    this.proveedorService.obtener(datos.proveedorId);

    if (diasHasta(datos.fechaVencimiento) <= 0) {
      throw new BadRequestException(
        'No se puede registrar un lote vencido o que vence hoy',
      );
    }

    const existente = this.lotes.find(
      (lote) =>
        lote.medicamentoId === datos.medicamentoId &&
        lote.numeroLote === datos.numeroLote,
    );
    if (existente !== undefined) {
      throw new ConflictException(
        `El lote ${datos.numeroLote} ya esta registrado para este medicamento`,
      );
    }

    const nuevoLote: LoteDto = {
      id: `${new Date().getTime()}`,
      medicamentoId: datos.medicamentoId,
      proveedorId: datos.proveedorId,
      numeroLote: datos.numeroLote,
      cantidadInicial: datos.cantidad,
      cantidad: datos.cantidad,
      fechaIngreso: hoy(),
      fechaVencimiento: datos.fechaVencimiento.slice(0, 10),
    };
    this.lotes.push(nuevoLote);

    return {
      message: 'Lote registrado correctamente',
      data: nuevoLote,
    };
  }

  listarLotes(medicamentoId?: string) {
    if (medicamentoId === undefined) {
      return this.lotes;
    }

    return this.lotes.filter((lote) => lote.medicamentoId === medicamentoId);
  }

  obtenerInventario(medicamentoId: string): InventarioDto {
    const medicamento = this.medicamentoService.obtener(medicamentoId);
    const lotes = this.ordenarPorVencimiento(this.listarLotes(medicamentoId));

    return {
      medicamento,
      stockDisponible: this.sumar(lotes.filter((lote) => !this.vencido(lote))),
      stockVencido: this.sumar(lotes.filter((lote) => this.vencido(lote))),
      lotes,
    };
  }

  lotesDisponibles(medicamentoId: string) {
    return this.ordenarPorVencimiento(
      this.listarLotes(medicamentoId).filter(
        (lote) => lote.cantidad > 0 && !this.vencido(lote),
      ),
    );
  }

  vencido(lote: LoteDto) {
    return diasHasta(lote.fechaVencimiento) <= 0;
  }

  private ordenarPorVencimiento(lotes: LoteDto[]) {
    return [...lotes].sort((a, b) =>
      a.fechaVencimiento.localeCompare(b.fechaVencimiento),
    );
  }

  private sumar(lotes: LoteDto[]) {
    return lotes.reduce((total, lote) => total + lote.cantidad, 0);
  }
}
