import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import type { Usuario } from '../auth/entities/usuario.entity';
import { bloqueoPesimista } from '../common/bloqueo';
import { hoy } from '../common/fechas';
import { Lote } from '../inventario/entities/lote.entity';
import { Movimiento } from '../inventario/entities/movimiento.entity';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import {
  DispensacionQueryDto,
  DispensacionRequestDto,
  LoteUsadoDto,
} from './dispensacion.dto';
import { Dispensacion } from './entities/dispensacion.entity';

@Injectable()
export class DispensacionService {
  constructor(
    @InjectRepository(Dispensacion)
    private readonly dispensacionRepository: Repository<Dispensacion>,
    private readonly medicamentoService: MedicamentoService,
    private readonly dataSource: DataSource,
  ) {}

  async dispensar(datos: DispensacionRequestDto, usuario?: Usuario) {
    const medicamento = await this.medicamentoService.obtener(
      datos.medicamentoId,
    );

    if (medicamento.requiereFormula && datos.formula === undefined) {
      throw new BadRequestException(
        `El medicamento ${medicamento.nombre} requiere formula del veterinario`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // FEFO: se descuenta primero del lote que vence antes. El bloqueo
      // pesimista serializa dispensaciones concurrentes del mismo medicamento
      // para que no descuenten dos veces las mismas unidades.
      const lotes = await manager.find(Lote, {
        where: {
          medicamentoId: medicamento.id,
          cantidad: MoreThan(0),
          fechaVencimiento: MoreThan(hoy()),
        },
        order: { fechaVencimiento: 'ASC', id: 'ASC' },
        lock: bloqueoPesimista(manager),
      });

      const disponible = lotes.reduce(
        (total, lote) => total + lote.cantidad,
        0,
      );
      if (disponible < datos.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente: hay ${disponible} unidades disponibles de ${medicamento.nombre}`,
        );
      }

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
          fechaVencimiento: lote.fechaVencimiento,
        });
      }

      await manager.save(lotes);

      const nuevaDispensacion = await manager.save(
        manager.create(Dispensacion, {
          ...datos,
          medicamento,
          usuario: usuario ? { id: usuario.id } : null,
          fecha: hoy(),
          total: medicamento.precio * datos.cantidad,
          lotesUsados,
        }),
      );

      await manager.save(
        lotesUsados.map((usado) =>
          manager.create(Movimiento, {
            tipo: 'SALIDA',
            cantidad: usado.cantidad,
            lote: { id: usado.loteId },
            medicamento: { id: medicamento.id },
            usuario: usuario ? { id: usuario.id } : null,
            detalle: `Dispensacion ${nuevaDispensacion.id} - ${datos.mascota}`,
          }),
        ),
      );

      return {
        message: 'Dispensacion registrada correctamente',
        data: this.aDto({
          ...nuevaDispensacion,
          usuario: usuario ?? null,
        }),
      };
    });
  }

  // Devuelve el stock a los lotes de donde salio la dispensacion y deja un
  // movimiento ANULACION por lote. Todo en una transaccion; el bloqueo de la
  // dispensacion evita anularla dos veces a la vez.
  async anular(id: number, motivo: string, usuario?: Usuario) {
    await this.dataSource.transaction(async (manager) => {
      const dispensacion = await manager.findOne(Dispensacion, {
        where: { id },
        lock: bloqueoPesimista(manager),
      });
      if (dispensacion === null) {
        throw new NotFoundException(`Dispensacion con ID ${id} no existe`);
      }
      if (dispensacion.estado === 'ANULADA') {
        throw new ConflictException(`La dispensacion ${id} ya esta anulada`);
      }

      const lotes = await manager.find(Lote, {
        where: { id: In(dispensacion.lotesUsados.map((l) => l.loteId)) },
        order: { id: 'ASC' },
        lock: bloqueoPesimista(manager),
      });
      for (const usado of dispensacion.lotesUsados) {
        const lote = lotes.find((l) => l.id === usado.loteId);
        if (lote !== undefined) {
          lote.cantidad += usado.cantidad;
        }
      }
      await manager.save(lotes);

      dispensacion.estado = 'ANULADA';
      dispensacion.motivoAnulacion = motivo;
      await manager.save(dispensacion);

      await manager.save(
        dispensacion.lotesUsados.map((usado) =>
          manager.create(Movimiento, {
            tipo: 'ANULACION',
            cantidad: usado.cantidad,
            lote: { id: usado.loteId },
            medicamento: { id: dispensacion.medicamentoId },
            usuario: usuario ? { id: usuario.id } : null,
            detalle: `Anulacion de la dispensacion ${id}: ${motivo}`,
          }),
        ),
      );
    });

    return {
      message: 'Dispensacion anulada correctamente',
      data: await this.obtener(id),
    };
  }

  async listar(filtro: DispensacionQueryDto = {}) {
    const desde = filtro.desde?.slice(0, 10);
    const hasta = filtro.hasta?.slice(0, 10);
    if (desde !== undefined && hasta !== undefined && desde > hasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta',
      );
    }

    const consulta = this.dispensacionRepository
      .createQueryBuilder('dispensacion')
      .leftJoinAndSelect('dispensacion.medicamento', 'medicamento')
      .leftJoinAndSelect('dispensacion.usuario', 'usuario')
      .orderBy('dispensacion.id', 'ASC');

    if (desde !== undefined) {
      consulta.andWhere('dispensacion.fecha >= :desde', { desde });
    }
    if (hasta !== undefined) {
      consulta.andWhere('dispensacion.fecha <= :hasta', { hasta });
    }
    if (filtro.medicamentoId !== undefined) {
      consulta.andWhere('dispensacion.medicamentoId = :medicamentoId', {
        medicamentoId: filtro.medicamentoId,
      });
    }
    const mascota = filtro.mascota?.trim();
    if (mascota) {
      // Se escapan los comodines para buscar el texto tal cual
      const texto = mascota.replace(/[\\%_]/g, (c) => `\\${c}`);
      consulta.andWhere(
        "LOWER(dispensacion.mascota) LIKE LOWER(:mascota) ESCAPE '\\'",
        { mascota: `%${texto}%` },
      );
    }

    const dispensaciones = await consulta.getMany();
    const data = dispensaciones.map((d) => this.aDto(d));

    return {
      message: 'Dispensaciones obtenidas correctamente',
      data,
      count: data.length,
    };
  }

  async obtener(id: number) {
    const dispensacion = await this.dispensacionRepository.findOne({
      where: { id },
      relations: { medicamento: true, usuario: true },
    });
    if (dispensacion === null) {
      throw new NotFoundException(`Dispensacion con ID ${id} no existe`);
    }

    return this.aDto(dispensacion);
  }

  // Expone solo id y nombre del usuario (no su correo ni su rol) y formula null
  private aDto(dispensacion: Dispensacion) {
    return {
      ...dispensacion,
      formula: dispensacion.formula ?? null,
      usuario: dispensacion.usuario
        ? { id: dispensacion.usuario.id, nombre: dispensacion.usuario.nombre }
        : null,
    };
  }
}
