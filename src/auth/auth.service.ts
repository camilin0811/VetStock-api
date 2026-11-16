import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Env } from '../env.model';
import { AuthResponseDto, LoginDto, RegistroDto } from './auth.dto';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './rol.enum';

const RONDAS_BCRYPT = 10;

export interface PayloadToken {
  sub: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
  ) {}

  async registrar(datos: RegistroDto, actual?: Usuario) {
    const existente = await this.usuarioRepository.findOneBy({
      correo: datos.correo,
    });
    if (existente !== null) {
      throw new ConflictException(
        `El correo ${datos.correo} ya esta registrado`,
      );
    }

    // Solo un admin crea admins; el primer usuario del sistema puede ser admin
    const rol = datos.rol ?? Rol.Farmaceutico;
    if (
      rol === Rol.Admin &&
      actual?.rol !== Rol.Admin &&
      (await this.usuarioRepository.count()) > 0
    ) {
      throw new ForbiddenException(
        'Solo un administrador puede crear usuarios con rol admin',
      );
    }

    const clave = await bcrypt.hash(datos.clave, RONDAS_BCRYPT);
    const guardado = await this.usuarioRepository.save(
      this.usuarioRepository.create({ ...datos, rol, clave }),
    );
    // Se vuelve a leer para devolver el usuario sin la clave
    const nuevoUsuario = await this.usuarioRepository.findOneByOrFail({
      id: guardado.id,
    });

    return {
      message: 'Usuario registrado correctamente',
      data: await this.generarTokens(nuevoUsuario),
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

    // Se vuelve a leer sin la clave para no devolver el hash
    const sinClave = await this.usuarioRepository.findOneByOrFail({
      id: usuario.id,
    });

    return {
      message: 'Ingreso exitoso',
      data: await this.generarTokens(sinClave),
    };
  }

  async refresh(refreshToken: string) {
    let id: number;
    try {
      const payload = await this.jwtService.verifyAsync<PayloadToken>(
        refreshToken,
        { secret: this.configService.getOrThrow('JWT_REFRESH_SECRET') },
      );
      id = Number(payload.sub);
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (usuario === null) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    return {
      message: 'Token renovado',
      data: await this.generarTokens(usuario),
    };
  }

  perfil(usuario: Usuario) {
    return { message: 'Perfil obtenido correctamente', data: usuario };
  }

  private async generarTokens(usuario: Usuario): Promise<AuthResponseDto> {
    const payload: PayloadToken = { sub: usuario.id };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: (this.configService.get('JWT_EXPIRES_IN') ??
          '15m') as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get('JWT_REFRESH_EXPIRES_IN') ??
          '7d') as JwtSignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken, usuario };
  }
}
