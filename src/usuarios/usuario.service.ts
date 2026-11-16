import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Not, Repository } from 'typeorm';
import { Usuario } from '../auth/entities/usuario.entity';
import { Rol } from '../auth/rol.enum';
import { ActualizarUsuarioDto } from './usuario.dto';

const RONDAS_BCRYPT = 10;

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async listar() {
    const usuarios = await this.usuarioRepository.find({
      order: { id: 'ASC' },
    });

    return {
      message: 'Usuarios obtenidos correctamente',
      data: usuarios,
      count: usuarios.length,
    };
  }

  async obtener(id: number) {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (usuario === null) {
      throw new NotFoundException(`Usuario con ID ${id} no existe`);
    }

    return usuario;
  }

  async actualizar(id: number, datos: ActualizarUsuarioDto) {
    const usuario = await this.obtener(id);

    if (datos.correo !== undefined && datos.correo !== usuario.correo) {
      const existente = await this.usuarioRepository.findOneBy({
        correo: datos.correo,
        id: Not(id),
      });
      if (existente !== null) {
        throw new ConflictException(
          `El correo ${datos.correo} ya esta registrado`,
        );
      }
    }

    if (
      usuario.rol === Rol.Admin &&
      datos.rol !== undefined &&
      datos.rol !== Rol.Admin &&
      (await this.usuarioRepository.countBy({ rol: Rol.Admin })) <= 1
    ) {
      throw new BadRequestException(
        'No se puede quitar el rol al unico administrador',
      );
    }

    const { clave, ...campos } = datos;
    this.usuarioRepository.merge(usuario, campos);
    if (clave !== undefined) {
      usuario.clave = await bcrypt.hash(clave, RONDAS_BCRYPT);
    }
    await this.usuarioRepository.save(usuario);

    // Se vuelve a leer para no devolver el hash de la clave
    return {
      message: 'Usuario actualizado correctamente',
      data: await this.obtener(id),
    };
  }

  async eliminar(id: number, usuarioActualId: number) {
    if (id === usuarioActualId) {
      throw new BadRequestException('No puedes eliminar tu propio usuario');
    }

    const usuario = await this.obtener(id);
    await this.usuarioRepository.remove(usuario);

    return { message: 'Usuario eliminado correctamente' };
  }
}
