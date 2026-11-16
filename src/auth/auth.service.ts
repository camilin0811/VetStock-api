import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthResponseDto, LoginDto, RegistroDto } from './auth.dto';
import { Usuario } from './entities/usuario.entity';

const RONDAS_BCRYPT = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async registrar(datos: RegistroDto) {
    const existente = await this.usuarioRepository.findOneBy({
      correo: datos.correo,
    });
    if (existente !== null) {
      throw new ConflictException(
        `El correo ${datos.correo} ya esta registrado`,
      );
    }

    const clave = await bcrypt.hash(datos.clave, RONDAS_BCRYPT);
    const guardado = await this.usuarioRepository.save(
      this.usuarioRepository.create({ ...datos, clave }),
    );
    // Se vuelve a leer para devolver el usuario sin la clave
    const nuevoUsuario = await this.usuarioRepository.findOneByOrFail({
      id: guardado.id,
    });

    return {
      message: 'Usuario registrado correctamente',
      data: this.generarTokens(nuevoUsuario),
    };
  }

  async login(datos: LoginDto) {
    // clave tiene select: false, por eso se pide de forma explicita
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.clave')
      .where('usuario.correo = :correo', { correo: datos.correo })
      .getOne();
    if (
      usuario === null ||
      !(await bcrypt.compare(datos.clave, usuario.clave))
    ) {
      throw new UnauthorizedException('Correo o clave incorrectos');
    }

    return {
      message: 'Ingreso exitoso',
      data: this.generarTokens(usuario),
    };
  }

  async refresh(refreshToken: string) {
    const id = Number(refreshToken.replace('refresh-', ''));
    if (!Number.isInteger(id)) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (usuario === null) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    return {
      message: 'Token renovado',
      data: this.generarTokens(usuario),
    };
  }

  private generarTokens(usuario: Usuario): AuthResponseDto {
    return {
      accessToken: `token-${usuario.id}`,
      refreshToken: `refresh-${usuario.id}`,
    };
  }
}
