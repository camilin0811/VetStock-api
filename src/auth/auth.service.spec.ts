import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { importacionesBdPrueba, sembrarBd } from '../../test/bd-prueba';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: importacionesBdPrueba(),
      providers: [AuthService],
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
