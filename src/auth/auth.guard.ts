import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Env } from '../env.model';
import type { PayloadToken } from './auth.service';
import { Usuario } from './entities/usuario.entity';
import { PUBLICO_KEY } from './publico.decorator';
import type { SolicitudAutenticada } from './usuario-actual.decorator';

// Guard global: exige Bearer token valido salvo en rutas @Publico().
// En rutas publicas, si llega un token valido igual se carga el usuario
// (lo usa el registro para saber si quien llama es admin).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async canActivate(contexto: ExecutionContext) {
    const publico = this.reflector.getAllAndOverride<boolean | undefined>(
      PUBLICO_KEY,
      [contexto.getHandler(), contexto.getClass()],
    );
    const solicitud = contexto
      .switchToHttp()
      .getRequest<SolicitudAutenticada>();
    const token = this.extraerToken(solicitud);

    if (publico) {
      if (token !== undefined) {
        solicitud.usuario = await this.validar(token).catch(() => undefined);
      }
      return true;
    }

    if (token === undefined) {
      throw new UnauthorizedException('Se requiere un token de acceso');
    }
    solicitud.usuario = await this.validar(token);
    return true;
  }

  private extraerToken(solicitud: SolicitudAutenticada) {
    const [tipo, token] = solicitud.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' && token ? token : undefined;
  }

  private async validar(token: string) {
    let id: number;
    try {
      const payload = await this.jwtService.verifyAsync<PayloadToken>(token, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });
      id = Number(payload.sub);
    } catch {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    // Se consulta el usuario para respetar cambios de rol y usuarios borrados
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (usuario === null) {
      throw new UnauthorizedException('El usuario del token ya no existe');
    }
    return usuario;
  }
}
