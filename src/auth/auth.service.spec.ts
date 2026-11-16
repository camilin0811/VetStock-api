import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { CLAVE_PRUEBA, importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
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
});
