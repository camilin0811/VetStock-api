import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { diasHasta, hoy } from '../common/fechas';
import type { Usuario } from '../auth/entities/usuario.entity';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { ProveedorService } from '../proveedores/proveedor.service';
import { Lote } from './entities/lote.entity';
import { Movimiento } from './entities/movimiento.entity';
import {
  EstadoStock,
  InventarioDto,
  ActualizarLoteDto,
  InventarioItemDto,
  LoteRequestDto,
} from './lote.dto';

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

  async obtenerLote(id: number) {
    const lote = await this.loteRepository.findOne({
      where: { id },
      relations: { medicamento: true, proveedor: true },
    });
    if (lote === null) {
      throw new NotFoundException(`Lote con ID ${id} no existe`);
    }

    return lote;
  }

  async actualizarLote(id: number, datos: ActualizarLoteDto) {
    const lote = await this.obtenerLote(id);

    if (
      datos.proveedorId !== undefined &&
      datos.proveedorId !== lote.proveedorId
    ) {
      lote.proveedor = await this.proveedorService.obtener(datos.proveedorId);
      lote.proveedorId = datos.proveedorId;
    }

    if (
      datos.numeroLote !== undefined &&
      datos.numeroLote !== lote.numeroLote
    ) {
      const existente = await this.loteRepository.findOneBy({
        medicamentoId: lote.medicamentoId,
        numeroLote: datos.numeroLote,
        id: Not(id),
      });
      if (existente !== null) {
        throw new ConflictException(
          `El lote ${datos.numeroLote} ya esta registrado para este medicamento`,
        );
      }
      lote.numeroLote = datos.numeroLote;
    }

    if (datos.fechaVencimiento !== undefined) {
      lote.fechaVencimiento = datos.fechaVencimiento.slice(0, 10);
    }

    const actualizado = await this.loteRepository.save(lote);

    return { message: 'Lote actualizado correctamente', data: actualizado };
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

  // Stock de todos los medicamentos con 2 consultas (medicamentos + suma de lotes),
  // sin consultar lote por lote
  async listarInventario() {
    const [medicamentos, filas] = await Promise.all([
      this.medicamentoService.listar(),
      this.loteRepository
        .createQueryBuilder('lote')
        .select('lote.medicamentoId', 'medicamentoId')
        .addSelect(
          'SUM(CASE WHEN lote.fechaVencimiento > :hoy THEN lote.cantidad ELSE 0 END)',
          'disponible',
        )
        .addSelect(
          'SUM(CASE WHEN lote.fechaVencimiento <= :hoy THEN lote.cantidad ELSE 0 END)',
          'vencido',
        )
        .setParameter('hoy', hoy())
        .groupBy('lote.medicamentoId')
        .getRawMany<{
          medicamentoId: number | string;
          disponible: number | string;
          vencido: number | string;
        }>(),
    ]);

    const stock = new Map(
      filas.map((fila) => [
        Number(fila.medicamentoId),
        { disponible: Number(fila.disponible), vencido: Number(fila.vencido) },
      ]),
    );

    const data: InventarioItemDto[] = medicamentos.data.map((medicamento) => {
      const { disponible, vencido } = stock.get(medicamento.id) ?? {
        disponible: 0,
        vencido: 0,
      };
      return {
        medicamento,
        disponible,
        vencido,
        estado: this.estadoStock(disponible, medicamento.stockMinimo),
      };
    });

    return {
      message: 'Inventario obtenido correctamente',
      data,
      count: data.length,
    };
  }

  estadoStock(disponible: number, stockMinimo: number): EstadoStock {
    if (disponible <= 0) {
      return 'SIN_STOCK';
    }
    return disponible < stockMinimo ? 'STOCK_BAJO' : 'OK';
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
