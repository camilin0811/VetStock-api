import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Rol } from './rol.enum';

class ControllerDePrueba {
  @Roles(Rol.Admin, Rol.Farmaceutico)
  restringida() {}

  libre() {}
}

function contexto(metodo: keyof ControllerDePrueba, rol?: Rol) {
  return {
    getHandler: () => ControllerDePrueba.prototype[metodo],
    getClass: () => ControllerDePrueba,
    switchToHttp: () => ({
      getRequest: () => ({ usuario: rol === undefined ? undefined : { rol } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('deja pasar rutas sin @Roles()', () => {
    expect(guard.canActivate(contexto('libre', Rol.Veterinario))).toBe(true);
  });

  it('permite los roles indicados', () => {
    expect(guard.canActivate(contexto('restringida', Rol.Admin))).toBe(true);
    expect(guard.canActivate(contexto('restringida', Rol.Farmaceutico))).toBe(
      true,
    );
  });

  it('lanza 403 con un rol no permitido o sin usuario', () => {
    expect(() =>
      guard.canActivate(contexto('restringida', Rol.Veterinario)),
    ).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contexto('restringida'))).toThrow(
      ForbiddenException,
    );
  });
});
