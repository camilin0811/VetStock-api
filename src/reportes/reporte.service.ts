import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThan, Repository } from 'typeorm';
import { diasDesdeHoy, diasHasta, hoy } from '../common/fechas';
import { DispensacionService } from '../dispensaciones/dispensacion.service';
import { Dispensacion } from '../dispensaciones/entities/dispensacion.entity';
import { Lote } from '../inventario/entities/lote.entity';
import { InventarioService } from '../inventario/inventario.service';
import { Medicamento } from '../medicamentos/entities/medicamento.entity';
import {
  ConsumoMedicamentoDto,
  ConsumoQueryDto,
  ProveedorRecibidoDto,
  ProveedoresQueryDto,
  ReporteConsumoDto,
  ReporteStockDto,
  ResumenDto,
  ReporteVencimientosDto,
} from './reporte.dto';

// Postgres devuelve SUM() como string y sqlite como number
const aNumero = (valor: unknown) => Number(valor ?? 0);
const DIAS_POR_VENCER = 30;
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
    private readonly dispensacionService: DispensacionService,
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

  // Unidades recibidas (cantidad inicial de los lotes) por proveedor segun la
  // fecha de ingreso; el valor usa el precio actual del medicamento.
  async proveedores(
    filtro: ProveedoresQueryDto,
  ): Promise<ProveedorRecibidoDto[]> {
    // Igual que el consumo: sin fechas se usan los ultimos 30 dias
    const { desde, hasta } = this.rango(filtro, diasDesdeHoy(-30), hoy());

    const consulta = this.loteRepository
      .createQueryBuilder('lote')
      .innerJoin('lote.proveedor', 'proveedor')
      .innerJoin('lote.medicamento', 'medicamento')
      .select('proveedor.id', 'id')
      .addSelect('proveedor.nombre', 'nombre')
      .addSelect('COUNT(lote.id)', 'lotes')
      .addSelect('SUM(lote.cantidadInicial)', 'unidades')
      .addSelect('SUM(lote.cantidadInicial * medicamento.precio)', 'valor')
      .groupBy('proveedor.id')
      .addGroupBy('proveedor.nombre')
      .orderBy('SUM(lote.cantidadInicial)', 'DESC')
      .addOrderBy('proveedor.id', 'ASC');
    consulta
      .andWhere('lote.fechaIngreso >= :desde', { desde })
      .andWhere('lote.fechaIngreso <= :hasta', { hasta });

    const filas = await consulta.getRawMany<{
      id: number | string;
      nombre: string;
      lotes: number | string;
      unidades: number | string;
      valor: number | string;
    }>();

    return filas.map((fila) => ({
      proveedor: { id: Number(fila.id), nombre: fila.nombre },
      lotes: aNumero(fila.lotes),
      unidades: aNumero(fila.unidades),
      valor: redondear(aNumero(fila.valor)),
    }));
  }

  // KPIs del dashboard: unas pocas consultas agregadas en paralelo, sin
  // consultar medicamento por medicamento
  async resumen(): Promise<ResumenDto> {
    const hoyStr = hoy();
    const desdeSemana = diasDesdeHoy(-6);
    const limite = diasDesdeHoy(DIAS_POR_VENCER);

    const [inventario, conteoLotes, porDia, proximos, ultimas] =
      await Promise.all([
        this.inventarioService.listarInventario(),
        this.loteRepository
          .createQueryBuilder('lote')
          .select(
            'COUNT(CASE WHEN lote.fechaVencimiento > :hoy AND lote.fechaVencimiento <= :limite THEN 1 END)',
            'porVencer',
          )
          .addSelect(
            'COUNT(CASE WHEN lote.fechaVencimiento <= :hoy THEN 1 END)',
            'vencidos',
          )
          .where('lote.cantidad > 0')
          .setParameters({ hoy: hoyStr, limite })
          .getRawOne<{
            porVencer: number | string;
            vencidos: number | string;
          }>(),
        this.dispensacionRepository
          .createQueryBuilder('dispensacion')
          // CAST a texto: Postgres devolveria un Date de JS en vez de 'YYYY-MM-DD'
          .select('CAST(dispensacion.fecha AS VARCHAR)', 'fecha')
          .addSelect('COUNT(dispensacion.id)', 'dispensaciones')
          .addSelect('SUM(dispensacion.cantidad)', 'unidades')
          .where("dispensacion.estado = 'ACTIVA'")
          .andWhere('dispensacion.fecha >= :desdeSemana', { desdeSemana })
          .andWhere('dispensacion.fecha <= :hoy', { hoy: hoyStr })
          .groupBy('dispensacion.fecha')
          .getRawMany<{
            fecha: string;
            dispensaciones: number | string;
            unidades: number | string;
          }>(),
        this.loteRepository.find({
          where: {
            cantidad: MoreThan(0),
            fechaVencimiento: Between(diasDesdeHoy(1), limite),
          },
          relations: { medicamento: true },
          order: { fechaVencimiento: 'ASC', id: 'ASC' },
          take: 5,
        }),
        this.dispensacionService.listarUltimas(5),
      ]);

    const medicamentos = inventario.data;
    const sanos = medicamentos.filter((item) => item.estado === 'OK').length;
    const porFecha = new Map(
      porDia.map((fila) => [String(fila.fecha).slice(0, 10), fila]),
    );

    return {
      totalMedicamentos: medicamentos.length,
      unidadesDisponibles: medicamentos.reduce(
        (total, item) => total + item.disponible,
        0,
      ),
      valorInventario: redondear(
        medicamentos.reduce(
          (total, item) => total + item.disponible * item.medicamento.precio,
          0,
        ),
      ),
      stockBajo: medicamentos.length - sanos,
      porVencer: aNumero(conteoLotes?.porVencer),
      vencidos: aNumero(conteoLotes?.vencidos),
      dispensacionesHoy: aNumero(porFecha.get(hoyStr)?.dispensaciones),
      dispensacionesSemana: porDia.reduce(
        (total, fila) => total + aNumero(fila.dispensaciones),
        0,
      ),
      porcentajeStockSaludable:
        medicamentos.length === 0
          ? 0
          : Math.round((sanos / medicamentos.length) * 100),
      consumoUltimos7Dias: Array.from({ length: 7 }, (_, i) => {
        const fecha = diasDesdeHoy(i - 6);
        return { fecha, unidades: aNumero(porFecha.get(fecha)?.unidades) };
      }),
      proximosVencimientos: proximos.map((lote) => ({
        loteId: lote.id,
        numeroLote: lote.numeroLote,
        medicamento: {
          id: lote.medicamento.id,
          nombre: lote.medicamento.nombre,
        },
        fechaVencimiento: lote.fechaVencimiento,
        diasRestantes: diasHasta(lote.fechaVencimiento),
        cantidad: lote.cantidad,
      })),
      ultimasDispensaciones: ultimas,
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
