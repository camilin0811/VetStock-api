import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarMedicamentoDto, MedicamentoDto } from './medicamento.dto';
import { Medicamento } from './entities/medicamento.entity';

@Injectable()
export class MedicamentoService {
  constructor(
    @InjectRepository(Medicamento)
    private readonly medicamentoRepository: Repository<Medicamento>,
  ) {}

  async listar() {
    return this.medicamentoRepository.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number) {
    const medicamento = await this.medicamentoRepository.findOneBy({ id });
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

    const nuevoMedicamento = await this.medicamentoRepository.save(
      this.medicamentoRepository.create(datos),
    );

    return {
      message: 'Medicamento registrado correctamente',
      data: nuevoMedicamento,
    };
  }

  async actualizar(id: number, datos: ActualizarMedicamentoDto) {
    const medicamento = await this.obtener(id);
    this.medicamentoRepository.merge(medicamento, datos);
    const actualizado = await this.medicamentoRepository.save(medicamento);

    return {
      message: 'Medicamento actualizado correctamente',
      data: actualizado,
    };
  }
}
