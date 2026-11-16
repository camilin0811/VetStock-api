import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { MovimientoDto, MovimientoQueryDto } from './movimiento.dto';

@Injectable()
export class MovimientoService {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
  ) {}

  // Del mas reciente al mas antiguo
  async listar(filtro: MovimientoQueryDto = {}) {
    const where: FindOptionsWhere<Movimiento> = {};
    if (filtro.medicamentoId !== undefined) {
      where.medicamentoId = filtro.medicamentoId;
    }
    if (filtro.tipo !== undefined) {
      where.tipo = filtro.tipo;
    }

    const movimientos = await this.movimientoRepository.find({
      where,
      relations: { lote: true, medicamento: true, usuario: true },
      order: { id: 'DESC' },
    });
    const data = movimientos.map((movimiento) => this.aDto(movimiento));

    return {
      message: 'Movimientos obtenidos correctamente',
      data,
      count: data.length,
    };
  }

  aDto(movimiento: Movimiento): MovimientoDto {
    return {
      id: movimiento.id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      loteId: movimiento.loteId,
      medicamentoId: movimiento.medicamentoId,
      medicamento: movimiento.medicamento,
      numeroLote: movimiento.lote.numeroLote,
      detalle: movimiento.detalle,
      usuario: movimiento.usuario
        ? { id: movimiento.usuario.id, nombre: movimiento.usuario.nombre }
        : null,
      fecha: movimiento.createdAt,
    };
  }
}
