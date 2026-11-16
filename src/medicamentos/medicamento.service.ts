import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaService } from '../categorias/categoria.service';
import { Dispensacion } from '../dispensaciones/entities/dispensacion.entity';
import { Lote } from '../inventario/entities/lote.entity';
import {
  ActualizarMedicamentoDto,
  MedicamentoDto,
  MedicamentoQueryDto,
} from './medicamento.dto';
import { Medicamento } from './entities/medicamento.entity';

@Injectable()
export class MedicamentoService {
  constructor(
    @InjectRepository(Medicamento)
    private readonly medicamentoRepository: Repository<Medicamento>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
    @InjectRepository(Dispensacion)
    private readonly dispensacionRepository: Repository<Dispensacion>,
    private readonly categoriaService: CategoriaService,
  ) {}

  async listar(filtro: MedicamentoQueryDto = {}) {
    const consulta = this.medicamentoRepository
      .createQueryBuilder('medicamento')
      .leftJoinAndSelect('medicamento.categorias', 'categoria')
      .orderBy('medicamento.id', 'ASC')
      .addOrderBy('categoria.id', 'ASC');

    const q = filtro.q?.trim();
    if (q) {
      // Se escapan los comodines para buscar el texto tal cual
      const texto = q.replace(/[\\%_]/g, (c) => `\\${c}`);
      consulta.andWhere(
        "LOWER(medicamento.nombre) LIKE LOWER(:q) ESCAPE '\\'",
        { q: `%${texto}%` },
      );
    }
    if (filtro.especie !== undefined) {
      consulta.andWhere('medicamento.especie = :especie', {
        especie: filtro.especie,
      });
    }
    if (filtro.categoriaId !== undefined) {
      // Subconsulta para filtrar sin perder las demas categorias del medicamento
      consulta.andWhere(
        'medicamento.id IN (SELECT mc.medicamento_id FROM medicamento_categorias mc WHERE mc.categoria_id = :categoriaId)',
        { categoriaId: filtro.categoriaId },
      );
    }

    const medicamentos = await consulta.getMany();

    return {
      message: 'Medicamentos obtenidos correctamente',
      data: medicamentos,
      count: medicamentos.length,
    };
  }

  async obtener(id: number) {
    const medicamento = await this.medicamentoRepository.findOne({
      where: { id },
      relations: { categorias: true },
    });
    if (medicamento === null) {
      throw new NotFoundException(`Medicamento con ID ${id} no existe`);
    }

    return medicamento;
  }

  async crear(datos: MedicamentoDto) {
    const existente = await this.medicamentoRepository
      .createQueryBuilder('medicamento')
      .where('LOWER(medicamento.nombre) = LOWER(:nombre)', {
        nombre: datos.nombre,
      })
      .getOne();
    if (existente !== null) {
      throw new ConflictException(
        `El medicamento ${datos.nombre} ya esta registrado`,
      );
    }

    const { categoriaIds, ...campos } = datos;
    const categorias = await this.categoriaService.obtenerPorIds(
      categoriaIds ?? [],
    );

    const nuevoMedicamento = await this.medicamentoRepository.save(
      this.medicamentoRepository.create({ ...campos, categorias }),
    );

    return {
      message: 'Medicamento registrado correctamente',
      data: nuevoMedicamento,
    };
  }

  async actualizar(id: number, datos: ActualizarMedicamentoDto) {
    const medicamento = await this.obtener(id);
    const { categoriaIds, ...campos } = datos;
    if (categoriaIds !== undefined) {
      medicamento.categorias =
        await this.categoriaService.obtenerPorIds(categoriaIds);
    }

    this.medicamentoRepository.merge(medicamento, campos);
    const actualizado = await this.medicamentoRepository.save(medicamento);

    return {
      message: 'Medicamento actualizado correctamente',
      data: actualizado,
    };
  }

  async eliminar(id: number) {
    const medicamento = await this.obtener(id);

    if ((await this.loteRepository.countBy({ medicamentoId: id })) > 0) {
      throw new ConflictException(
        `No se puede eliminar ${medicamento.nombre}: tiene lotes registrados`,
      );
    }
    if (
      (await this.dispensacionRepository.countBy({ medicamentoId: id })) > 0
    ) {
      throw new ConflictException(
        `No se puede eliminar ${medicamento.nombre}: tiene dispensaciones registradas`,
      );
    }

    await this.medicamentoRepository.remove(medicamento);

    return { message: 'Medicamento eliminado correctamente' };
  }
}
