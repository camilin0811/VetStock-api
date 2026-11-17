import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import {
  CLAVE_PRUEBA,
  importacionesBdPrueba,
  sembrarBd,
} from '../../test/bd-prueba';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { Usuario } from './entities/usuario.entity';

describe('AuthService', () => {
  let service: AuthService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...importacionesBdPrueba(), AuthModule],
    }).compile();
    await sembrarBd(testingModule.get(DataSource));

    service = testingModule.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('registra un usuario y devuelve tokens', async () => {
    const resultado = await service.registrar({
      nombre: 'Laura',
      correo: 'laura@vetstock.com',
      clave: '123456',
    });

    expect(resultado.data.accessToken).toBeDefined();
    expect(resultado.data.refreshToken).toBeDefined();
  });

  it('guarda la clave con hash bcrypt y no la devuelve', async () => {
    const resultado = await service.registrar({
      nombre: 'Laura',
      correo: 'laura@vetstock.com',
      clave: '123456',
    });

    const guardado = await testingModule
      .get(DataSource)
      .getRepository(Usuario)
      .createQueryBuilder('usuario')
      .addSelect('usuario.clave')
      .where('usuario.correo = :correo', { correo: 'laura@vetstock.com' })
      .getOneOrFail();

    expect(guardado.clave).not.toBe('123456');
    expect(await bcrypt.compare('123456', guardado.clave)).toBe(true);
    expect(JSON.stringify(resultado)).not.toContain(guardado.clave);
  });

  it('ingresa con la clave correcta y rechaza una incorrecta', async () => {
    const ok = await service.login({
      correo: 'andres@vetstock.com',
      clave: CLAVE_PRUEBA,
    });
    expect(ok.data.accessToken).toBeDefined();

    await expect(
      service.login({ correo: 'andres@vetstock.com', clave: 'incorrecta' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login devuelve tokens jwt y el usuario sin clave', async () => {
    const { data } = await service.login({
      correo: 'andres@vetstock.com',
      clave: CLAVE_PRUEBA,
    });

    expect(data.accessToken.split('.')).toHaveLength(3);
    expect(data.refreshToken.split('.')).toHaveLength(3);
    expect(data.accessToken).not.toBe(data.refreshToken);
    expect(data.usuario.correo).toBe('andres@vetstock.com');
    expect(data.usuario.clave).toBeUndefined();
  });

  it('refresh renueva los tokens con un refresh token valido', async () => {
    const { data } = await service.login({
      correo: 'andres@vetstock.com',
      clave: CLAVE_PRUEBA,
    });

    const renovado = await service.refresh(data.refreshToken);

    expect(renovado.data.accessToken).toBeDefined();
    expect(renovado.data.usuario.id).toBe(1);
  });

  it('refresh rechaza tokens invalidos y el access token', async () => {
    const { data } = await service.login({
      correo: 'andres@vetstock.com',
      clave: CLAVE_PRUEBA,
    });

    await expect(service.refresh('token-1')).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(service.refresh(data.accessToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('lanza error con credenciales invalidas', async () => {
    await expect(
      service.login({ correo: 'nadie@vetstock.com', clave: 'mala' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('lanza error si el correo ya esta registrado', async () => {
    await expect(
      service.registrar({
        nombre: 'Andres',
        correo: 'andres@vetstock.com',
        clave: '123456',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('perfil devuelve el usuario recibido', async () => {
    const usuario = await testingModule
      .get(DataSource)
      .getRepository(Usuario)
      .findOneByOrFail({ id: 1 });

    const resultado = service.perfil(usuario);

    expect(resultado.data.correo).toBe('andres@vetstock.com');
    expect(resultado.data.clave).toBeUndefined();
  });
});
