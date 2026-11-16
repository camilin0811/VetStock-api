import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Usuario } from './entities/usuario.entity';

export type SolicitudAutenticada = Request & { usuario?: Usuario };

// Usuario autenticado que puso el AuthGuard (undefined en rutas publicas sin token)
export const UsuarioActual = createParamDecorator(
  (_data: unknown, contexto: ExecutionContext): Usuario | undefined =>
    contexto.switchToHttp().getRequest<SolicitudAutenticada>().usuario,
);
