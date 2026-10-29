import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { diasHasta, hoy } from '../common/fechas';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { Lote } from './entities/lote.entity';
import { InventarioDto, LoteRequestDto } from './lote.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
    private readonly medicamentoService: MedicamentoService,
    private readonly proveedorService: ProveedorService,
  ) {}

  async registrarLote(datos: LoteRequestDto) {
    await this.medicamentoService.obtener(datos.medicamentoId);
    await this.proveedorService.obtener(datos.proveedorId);

    if (diasHasta(datos.fechaVencimiento) <= 0) {
      throw new BadRequestException(
        'No se puede registrar un lote vencido o que vence hoy',
      );
    }

    const existente = await this.loteRepository.findOneBy({
      medicamentoId: datos.medicamentoId,
      numeroLote: datos.numeroLote,
    });
    if (existente !== null) {
      throw new ConflictException(
        `El lote ${datos.numeroLote} ya esta registrado para este medicamento`,
      );
    }

    const nuevoLote = await this.loteRepository.save(
      this.loteRepository.create({
        medicamentoId: datos.medicamentoId,
        proveedorId: datos.proveedorId,
        numeroLote: datos.numeroLote,
        cantidadInicial: datos.cantidad,
        cantidad: datos.cantidad,
        fechaIngreso: hoy(),
        fechaVencimiento: datos.fechaVencimiento.slice(0, 10),
      }),
    );

    return {
      message: 'Lote registrado correctamente',
      data: nuevoLote,
    };
  }

  async listarLotes(medicamentoId?: number) {
    return this.loteRepository.find({
      where: medicamentoId === undefined ? {} : { medicamentoId },
      order: { id: 'ASC' },
    });
  }

  async obtenerInventario(medicamentoId: number): Promise<InventarioDto> {
    const medicamento = await this.medicamentoService.obtener(medicamentoId);
    const lotes = this.ordenarPorVencimiento(
      await this.listarLotes(medicamentoId),
    );

    return {
      medicamento,
      stockDisponible: this.sumar(lotes.filter((lote) => !this.vencido(lote))),
      stockVencido: this.sumar(lotes.filter((lote) => this.vencido(lote))),
      lotes,
    };
  }

  vencido(lote: Lote) {
    return diasHasta(lote.fechaVencimiento) <= 0;
  }

  private ordenarPorVencimiento(lotes: Lote[]) {
    return [...lotes].sort((a, b) =>
      a.fechaVencimiento.localeCompare(b.fechaVencimiento),
    );
  }

  private sumar(lotes: Lote[]) {
    return lotes.reduce((total, lote) => total + lote.cantidad, 0);
  }
}
