import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('VetStock API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('POST /auth/registro registra un usuario', () => {
    return request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Laura', correo: 'laura@vetstock.com', clave: '123456' })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body.data.accessToken).toBeDefined();
      });
  });

  it('POST /auth/login rechaza credenciales invalidas', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo: 'nadie@vetstock.com', clave: 'mala' })
      .expect(401);
  });

  it('GET /medicamentos lista el catalogo', () => {
    return request(app.getHttpServer())
      .get('/medicamentos')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.length).toBeGreaterThan(0);
      });
  });

  it('POST /medicamentos rechaza datos invalidos', () => {
    return request(app.getHttpServer())
      .post('/medicamentos')
      .send({ nombre: 'Sin precio', especie: 'dinosaurio' })
      .expect(400);
  });

  it('GET /medicamentos/:id responde 404 si no existe', () => {
    return request(app.getHttpServer()).get('/medicamentos/999').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
