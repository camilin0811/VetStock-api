import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ActualizarCategoriaDto, CategoriaDto } from './categoria.dto';
import { Categoria } from './entities/categoria.entity';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async listar() {
    const categorias = await this.categoriaRepository.find({
      order: { id: 'ASC' },
    });

    return {
      message: 'Categorias obtenidas correctamente',
      data: categorias,
      count: categorias.length,
    };
  }

  async obtener(id: number) {
    const categoria = await this.categoriaRepository.findOneBy({ id });
    if (categoria === null) {
      throw new NotFoundException(`Categoria con ID ${id} no existe`);
    }

    return categoria;
  }

  // Devuelve las categorias de los ids o lanza 404 si alguno no existe
  async obtenerPorIds(ids: number[]) {
    const unicos = [...new Set(ids)];
    if (unicos.length === 0) {
      return [];
    }

    const categorias = await this.categoriaRepository.find({
      where: { id: In(unicos) },
      order: { id: 'ASC' },
    });
    const faltantes = unicos.filter(
      (id) => !categorias.some((categoria) => categoria.id === id),
    );
    if (faltantes.length > 0) {
      throw new NotFoundException(
        `Categorias con ID ${faltantes.join(', ')} no existen`,
      );
    }

    return categorias;
  }

  async crear(datos: CategoriaDto) {
    await this.validarNombreLibre(datos.nombre);

    const nuevaCategoria = await this.categoriaRepository.save(
      this.categoriaRepository.create(datos),
    );

    return {
      message: 'Categoria registrada correctamente',
      data: nuevaCategoria,
    };
  }

  // PUT: reemplazo completo; la descripcion omitida se borra
  reemplazar(id: number, datos: CategoriaDto) {
    return this.actualizar(id, {
      ...datos,
      descripcion: datos.descripcion ?? null,
    });
  }

  // PATCH: solo cambia los campos enviados
  async actualizar(
    id: number,
    datos: Omit<ActualizarCategoriaDto, 'descripcion'> & {
      descripcion?: string | null;
    },
  ) {
    const categoria = await this.obtener(id);
    if (datos.nombre !== undefined) {
      await this.validarNombreLibre(datos.nombre, id);
    }

    this.categoriaRepository.merge(categoria, datos);
    const actualizada = await this.categoriaRepository.save(categoria);

    return {
      message: 'Categoria actualizada correctamente',
      data: actualizada,
    };
  }

  async eliminar(id: number) {
    const categoria = await this.obtener(id);
    await this.categoriaRepository.remove(categoria);

    return { message: 'Categoria eliminada correctamente' };
  }

  private async validarNombreLibre(nombre: string, excluirId?: number) {
    const consulta = this.categoriaRepository
      .createQueryBuilder('categoria')
      .where('LOWER(categoria.nombre) = LOWER(:nombre)', { nombre });
    if (excluirId !== undefined) {
      consulta.andWhere('categoria.id != :excluirId', { excluirId });
    }

    const existente = await consulta.getOne();
    if (existente !== null) {
      throw new ConflictException(`La categoria ${nombre} ya esta registrada`);
    }
  }
}
