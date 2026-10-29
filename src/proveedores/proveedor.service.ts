import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { ProveedorDto } from './proveedor.dto';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async listar() {
    return this.proveedorRepository.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number) {
    const proveedor = await this.proveedorRepository.findOneBy({ id });
    if (proveedor === null) {
      throw new NotFoundException(`Proveedor con ID ${id} no existe`);
    }

    return proveedor;
  }

  async crear(datos: ProveedorDto) {
    const existente = await this.proveedorRepository.findOneBy({
      nit: datos.nit,
    });
    if (existente !== null) {
      throw new ConflictException(
        `El proveedor con NIT ${datos.nit} ya esta registrado`,
      );
    }

    const nuevoProveedor = await this.proveedorRepository.save(
      this.proveedorRepository.create(datos),
    );

    return {
      message: 'Proveedor registrado correctamente',
      data: nuevoProveedor,
    };
  }
}
