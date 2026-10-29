import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { hoy } from '../common/fechas';
import { Lote } from '../inventario/entities/lote.entity';
import { MedicamentoService } from '../medicamentos/medicamento.service';
import { DispensacionRequestDto, LoteUsadoDto } from './dispensacion.dto';
import { Dispensacion } from './entities/dispensacion.entity';

@Injectable()
export class DispensacionService {
  constructor(
    @InjectRepository(Dispensacion)
    private readonly dispensacionRepository: Repository<Dispensacion>,
    private readonly medicamentoService: MedicamentoService,
    private readonly dataSource: DataSource,
  ) {}

  async dispensar(datos: DispensacionRequestDto) {
    const medicamento = await this.medicamentoService.obtener(
      datos.medicamentoId,
    );

    if (medicamento.requiereFormula && datos.formula === undefined) {
      throw new BadRequestException(
        `El medicamento ${medicamento.nombre} requiere formula del veterinario`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // FEFO: se descuenta primero del lote que vence antes
      const lotes = await manager.find(Lote, {
        where: {
          medicamentoId: medicamento.id,
          cantidad: MoreThan(0),
          fechaVencimiento: MoreThan(hoy()),
        },
        order: { fechaVencimiento: 'ASC' },
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
        });
      }

      await manager.save(lotes);

      const nuevaDispensacion = await manager.save(
        manager.create(Dispensacion, {
          medicamentoId: medicamento.id,
          cantidad: datos.cantidad,
          mascota: datos.mascota,
          veterinario: datos.veterinario,
          formula: datos.formula,
          fecha: hoy(),
          total: medicamento.precio * datos.cantidad,
          lotesUsados,
        }),
      );

      return {
        message: 'Dispensacion registrada correctamente',
        data: nuevaDispensacion,
      };
    });
  }

  async listar() {
    return this.dispensacionRepository.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number) {
    const dispensacion = await this.dispensacionRepository.findOneBy({ id });
    if (dispensacion === null) {
      throw new NotFoundException(`Dispensacion con ID ${id} no existe`);
    }

    return dispensacion;
  }
}
