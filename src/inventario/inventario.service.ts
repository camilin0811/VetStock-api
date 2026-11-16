import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { diasHasta, hoy } from '../common/fechas';
import type { Usuario } from '../auth/entities/usuario.entity';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { Lote } from './entities/lote.entity';
import { Movimiento } from './entities/movimiento.entity';
import { InventarioDto, LoteRequestDto } from './lote.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
    private readonly medicamentoService: MedicamentoService,
    private readonly proveedorService: ProveedorService,
  ) {}

  async registrarLote(datos: LoteRequestDto, usuario?: Usuario) {
    const medicamento = await this.medicamentoService.obtener(
      datos.medicamentoId,
    );
    const proveedor = await this.proveedorService.obtener(datos.proveedorId);

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

    // El lote y su movimiento de ENTRADA se guardan juntos o no se guardan
    const nuevoLote = await this.loteRepository.manager.transaction(
      async (manager) => {
        const lote = await manager.save(
          manager.create(Lote, {
            ...datos,
            medicamento,
            proveedor,
            cantidadInicial: datos.cantidad,
            fechaIngreso: hoy(),
            fechaVencimiento: datos.fechaVencimiento.slice(0, 10),
          }),
        );
        await manager.save(
          manager.create(Movimiento, {
            tipo: 'ENTRADA',
            cantidad: lote.cantidad,
            lote: { id: lote.id },
            medicamento: { id: medicamento.id },
            usuario: usuario ? { id: usuario.id } : null,
            detalle: `Ingreso del lote ${lote.numeroLote} de ${proveedor.nombre}`,
          }),
        );
        return lote;
      },
    );

    return {
      message: 'Lote registrado correctamente',
      data: nuevoLote,
    };
  }

  async listarLotes(medicamentoId?: number) {
    const lotes = await this.buscarLotes(medicamentoId, true);

    return {
      message: 'Lotes obtenidos correctamente',
      data: lotes,
      count: lotes.length,
    };
  }

  async buscarLotes(medicamentoId?: number, conRelaciones = false) {
    return this.loteRepository.find({
      where: medicamentoId === undefined ? {} : { medicamentoId },
      relations: conRelaciones ? { medicamento: true, proveedor: true } : {},
      order: { id: 'ASC' },
    });
  }

  async obtenerInventario(medicamentoId: number): Promise<InventarioDto> {
    const medicamento = await this.medicamentoService.obtener(medicamentoId);
    const lotes = this.ordenarPorVencimiento(
      await this.buscarLotes(medicamentoId),
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
