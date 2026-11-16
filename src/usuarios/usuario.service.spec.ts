import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import {
  importacionesBdPrueba,
  sembrarBd,
  USUARIOS_PRUEBA,
} from '../../test/bd-prueba';
import { Usuario } from '../auth/entities/usuario.entity';
import { Rol } from '../auth/rol.enum';
import { UsuarioService } from './usuario.service';
import { UsuariosModule } from './usuarios.module';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), UsuariosModule],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<UsuarioService>(UsuarioService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('lista los usuarios con count y sin clave', async () => {
    const resultado = await service.listar();

    expect(resultado.count).toBe(3);
    expect(JSON.stringify(resultado)).not.toContain('clave');
  });

  it('obtiene un usuario y lanza 404 si no existe', async () => {
    expect((await service.obtener(2)).correo).toBe(USUARIOS_PRUEBA.veterinario);
    await expect(service.obtener(999)).rejects.toThrow(NotFoundException);
  });

  it('actualiza nombre y rol sin devolver la clave', async () => {
    const { data } = await service.actualizar(3, {
      nombre: 'Camila Perez',
      rol: Rol.Veterinario,
    });

    expect(data.nombre).toBe('Camila Perez');
    expect(data.rol).toBe(Rol.Veterinario);
    expect(data.clave).toBeUndefined();
  });

  it('guarda la clave nueva con hash bcrypt', async () => {
    await service.actualizar(3, { clave: 'NuevaClave456*' });

    const guardado = await testingModule
      .get(DataSource)
      .getRepository(Usuario)
      .createQueryBuilder('usuario')
      .addSelect('usuario.clave')
      .where('usuario.id = 3')
      .getOneOrFail();

    expect(guardado.clave).not.toBe('NuevaClave456*');
    expect(await bcrypt.compare('NuevaClave456*', guardado.clave)).toBe(true);
  });

  it('conserva la clave si no se envia', async () => {
    await service.actualizar(3, { nombre: 'Otra' });

    const guardado = await testingModule
      .get(DataSource)
      .getRepository(Usuario)
      .createQueryBuilder('usuario')
      .addSelect('usuario.clave')
      .where('usuario.id = 3')
      .getOneOrFail();

    expect(guardado.clave).toMatch(/^\$2[aby]\$/);
  });

  it('lanza 409 si el correo ya lo usa otro usuario', async () => {
    await expect(
      service.actualizar(3, { correo: USUARIOS_PRUEBA.admin }),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.actualizar(3, { correo: USUARIOS_PRUEBA.farmaceutico }),
    ).resolves.toBeDefined();
  });

  it('no deja quitar el rol al unico admin', async () => {
    await expect(
      service.actualizar(1, { rol: Rol.Veterinario }),
    ).rejects.toThrow(BadRequestException);
  });

  it('elimina un usuario y no deja eliminarse a si mismo', async () => {
    await expect(service.eliminar(1, 1)).rejects.toThrow(BadRequestException);
    await service.eliminar(3, 1);
    await expect(service.obtener(3)).rejects.toThrow(NotFoundException);
    await expect(service.eliminar(999, 1)).rejects.toThrow(NotFoundException);
  });
});
