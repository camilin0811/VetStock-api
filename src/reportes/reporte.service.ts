import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { diasDesdeHoy, hoy } from '../common/fechas';
import { Dispensacion } from '../dispensaciones/entities/dispensacion.entity';
import { Lote } from '../inventario/entities/lote.entity';
import { InventarioService } from '../inventario/inventario.service';
import { Medicamento } from '../medicamentos/entities/medicamento.entity';
import {
  ConsumoMedicamentoDto,
  ConsumoQueryDto,
  ReporteConsumoDto,
  ReporteStockDto,
  ReporteVencimientosDto,
} from './reporte.dto';

// Postgres devuelve SUM() como string y sqlite como number
const aNumero = (valor: unknown) => Number(valor ?? 0);
const redondear = (valor: number) => Math.round(valor * 100) / 100;

@Injectable()
export class ReporteService {
  constructor(
    @InjectRepository(Dispensacion)
    private readonly dispensacionRepository: Repository<Dispensacion>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
    @InjectRepository(Medicamento)
    private readonly medicamentoRepository: Repository<Medicamento>,
    private readonly inventarioService: InventarioService,
  ) {}

  async consumo(filtro: ConsumoQueryDto): Promise<ReporteConsumoDto> {
    const { desde, hasta } = this.rango(filtro, diasDesdeHoy(-30), hoy());

    // Una sola consulta agregada; las dispensaciones anuladas no cuentan
    const filas = await this.dispensacionRepository
      .createQueryBuilder('dispensacion')
      .select('dispensacion.medicamentoId', 'medicamentoId')
      .addSelect('SUM(dispensacion.cantidad)', 'unidades')
      .addSelect('SUM(dispensacion.total)', 'total')
      .where("dispensacion.estado = 'ACTIVA'")
      .andWhere('dispensacion.fecha >= :desde', { desde })
      .andWhere('dispensacion.fecha <= :hasta', { hasta })
      .groupBy('dispensacion.medicamentoId')
      .getRawMany<{
        medicamentoId: number | string;
        unidades: number | string;
        total: number | string;
      }>();

    const medicamentos = new Map(
      (filas.length === 0
        ? []
        : await this.medicamentoRepository.findBy({
            id: In(filas.map((fila) => Number(fila.medicamentoId))),
          })
      ).map((medicamento) => [medicamento.id, medicamento]),
    );

    const detalle: ConsumoMedicamentoDto[] = filas
      .map((fila) => ({
        medicamento: medicamentos.get(Number(fila.medicamentoId))!,
        unidades: aNumero(fila.unidades),
        total: redondear(aNumero(fila.total)),
      }))
      .sort((a, b) => b.unidades - a.unidades);

    return {
      desde,
      hasta,
      totalUnidades: detalle.reduce((total, d) => total + d.unidades, 0),
      totalVentas: redondear(detalle.reduce((total, d) => total + d.total, 0)),
      detalle,
    };
  }

  // Lotes vencidos con unidades, junto con su medicamento, en una consulta
  async vencimientos(): Promise<ReporteVencimientosDto> {
    const lotes = await this.loteRepository
      .createQueryBuilder('lote')
      .innerJoinAndSelect('lote.medicamento', 'medicamento')
      .leftJoinAndSelect('medicamento.categorias', 'categoria')
      .where('lote.cantidad > 0')
      .andWhere('lote.fechaVencimiento <= :hoy', { hoy: hoy() })
      .orderBy('lote.fechaVencimiento', 'ASC')
      .addOrderBy('lote.id', 'ASC')
      .getMany();

    const vencidos = lotes.map(({ medicamento, ...lote }) => ({
      lote,
      medicamento,
      perdida: redondear(lote.cantidad * medicamento.precio),
    }));

    return {
      totalPerdida: redondear(
        vencidos.reduce((total, vencido) => total + vencido.perdida, 0),
      ),
      lotes: vencidos,
    };
  }

  // Valorizacion del stock disponible (sin lotes vencidos) al precio actual
  async stock(): Promise<ReporteStockDto> {
    const { data } = await this.inventarioService.listarInventario();

    const items = data
      .filter((item) => item.disponible > 0)
      .map((item) => ({
        medicamento: {
          id: item.medicamento.id,
          nombre: item.medicamento.nombre,
        },
        unidades: item.disponible,
        valor: redondear(item.disponible * item.medicamento.precio),
      }))
      .sort((a, b) => b.valor - a.valor || a.medicamento.id - b.medicamento.id);

    return {
      items,
      valorTotal: redondear(items.reduce((total, i) => total + i.valor, 0)),
    };
  }

  private rango(
    filtro: ConsumoQueryDto,
    desdePorDefecto: string,
    hastaPorDefecto: string,
  ) {
    const desde = filtro.desde?.slice(0, 10) ?? desdePorDefecto;
    const hasta = filtro.hasta?.slice(0, 10) ?? hastaPorDefecto;
    if (desde > hasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta',
      );
    }

    return { desde, hasta };
  }
}
