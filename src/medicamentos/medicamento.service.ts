import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaService } from '../categorias/categoria.service';
import { ActualizarMedicamentoDto, MedicamentoDto } from './medicamento.dto';
import { Medicamento } from './entities/medicamento.entity';

@Injectable()
export class MedicamentoService {
  constructor(
    @InjectRepository(Medicamento)
    private readonly medicamentoRepository: Repository<Medicamento>,
    private readonly categoriaService: CategoriaService,
  ) {}

  async listar() {
    const medicamentos = await this.medicamentoRepository.find({
      relations: { categorias: true },
      order: { id: 'ASC' },
    });

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
}
