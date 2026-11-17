import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Lote } from '../inventario/entities/lote.entity';
import { Proveedor } from './entities/proveedor.entity';
import { ActualizarProveedorDto, ProveedorDto } from './proveedor.dto';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
    @InjectRepository(Lote)
    private readonly loteRepository: Repository<Lote>,
  ) {}

  async listar() {
    const proveedores = await this.proveedorRepository.find({
      order: { id: 'ASC' },
    });

    return {
      message: 'Proveedores obtenidos correctamente',
      data: proveedores,
      count: proveedores.length,
    };
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

  // PUT: reemplazo completo; el correo omitido se borra
  reemplazar(id: number, datos: ProveedorDto) {
    return this.actualizar(id, { ...datos, correo: datos.correo ?? null });
  }

  // PATCH: solo cambia los campos enviados
  async actualizar(
    id: number,
    datos: Omit<ActualizarProveedorDto, 'correo'> & { correo?: string | null },
  ) {
    const proveedor = await this.obtener(id);

    if (datos.nit !== undefined && datos.nit !== proveedor.nit) {
      const existente = await this.proveedorRepository.findOneBy({
        nit: datos.nit,
        id: Not(id),
      });
      if (existente !== null) {
        throw new ConflictException(
          `El proveedor con NIT ${datos.nit} ya esta registrado`,
        );
      }
    }

    this.proveedorRepository.merge(proveedor, datos);
    const actualizado = await this.proveedorRepository.save(proveedor);

    return {
      message: 'Proveedor actualizado correctamente',
      data: actualizado,
    };
  }

  async eliminar(id: number) {
    const proveedor = await this.obtener(id);

    if ((await this.loteRepository.countBy({ proveedorId: id })) > 0) {
      throw new ConflictException(
        `No se puede eliminar ${proveedor.nombre}: tiene lotes registrados`,
      );
    }

    await this.proveedorRepository.remove(proveedor);

    return { message: 'Proveedor eliminado correctamente' };
  }
}
