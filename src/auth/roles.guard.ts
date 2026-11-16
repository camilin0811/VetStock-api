import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Rol } from './rol.enum';
import type { SolicitudAutenticada } from './usuario-actual.decorator';

// Se ejecuta despues del AuthGuard; sin @Roles() deja pasar a cualquier autenticado
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_KEY,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (roles === undefined || roles.length === 0) {
      return true;
    }

    const usuario = contexto
      .switchToHttp()
      .getRequest<SolicitudAutenticada>().usuario;
    if (usuario === undefined || !roles.includes(usuario.rol)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta accion',
      );
    }
    return true;
  }
}
