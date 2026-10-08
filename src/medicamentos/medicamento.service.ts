import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActualizarMedicamentoDto,
  MedicamentoDto,
  MedicamentoResponseDto,
} from './medicamento.dto';

@Injectable()
export class MedicamentoService {
  private medicamentos: MedicamentoResponseDto[] = [
    {
      id: '1',
      nombre: 'Amoxicilina 250 mg',
      presentacion: 'Tabletas x 10',
      especie: 'canino',
      precio: 18000,
      stockMinimo: 20,
      requiereFormula: true,
    },
    {
      id: '2',
      nombre: 'Vacuna antirrabica',
      presentacion: 'Frasco 1 ml',
      especie: 'general',
      precio: 25000,
      stockMinimo: 10,
      requiereFormula: false,
    },
    {
      id: '3',
      nombre: 'Meloxicam 1.5 mg/ml',
      presentacion: 'Suspension oral 10 ml',
      especie: 'felino',
      precio: 32000,
      stockMinimo: 5,
      requiereFormula: true,
    },
    {
      id: '4',
      nombre: 'Desparasitante Albendazol',
      presentacion: 'Suspension 100 ml',
      especie: 'bovino',
      precio: 45000,
      stockMinimo: 8,
      requiereFormula: false,
    },
  ];

  listar() {
    return this.medicamentos;
  }

  obtener(id: string) {
    const medicamento = this.medicamentos.find(
      (medicamento) => medicamento.id === id,
    );
    if (medicamento === undefined) {
      throw new NotFoundException(`Medicamento con ID ${id} no existe`);
    }

    return medicamento;
  }

  crear(datos: MedicamentoDto) {
    const existente = this.medicamentos.find(
      (medicamento) =>
        medicamento.nombre.toLowerCase() === datos.nombre.toLowerCase(),
    );
    if (existente !== undefined) {
      throw new ConflictException(
        `El medicamento ${datos.nombre} ya esta registrado`,
      );
    }

    const nuevoMedicamento: MedicamentoResponseDto = {
      id: `${new Date().getTime()}`,
      ...datos,
    };
    this.medicamentos.push(nuevoMedicamento);

    return {
      message: 'Medicamento registrado correctamente',
      data: nuevoMedicamento,
    };
  }

  actualizar(id: string, datos: ActualizarMedicamentoDto) {
    const medicamento = this.obtener(id);
    Object.assign(medicamento, datos);

    return {
      message: 'Medicamento actualizado correctamente',
      data: medicamento,
    };
  }
}
