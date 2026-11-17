import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppPrueba, crearAppPrueba } from './app-prueba';
import { CLAVE_PRUEBA, USUARIOS_PRUEBA } from './bd-prueba';

describe('Auth (e2e)', () => {
  let contexto: AppPrueba;
  const http = () => request(contexto.app.getHttpServer());

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  it('POST /auth/login devuelve tokens y el usuario sin clave', async () => {
    const respuesta = await http()
      .post('/auth/login')
      .send({ correo: USUARIOS_PRUEBA.admin, clave: CLAVE_PRUEBA })
      .expect(200);

    expect(respuesta.body.data.accessToken).toBeDefined();
    expect(respuesta.body.data.refreshToken).toBeDefined();
    expect(respuesta.body.data.usuario).toMatchObject({
      id: 1,
      correo: USUARIOS_PRUEBA.admin,
      rol: 'admin',
    });
    expect(JSON.stringify(respuesta.body)).not.toContain('clave');
  });

  it('POST /auth/login rechaza credenciales invalidas con 401', async () => {
    await http()
      .post('/auth/login')
      .send({ correo: 'nadie@vetstock.com', clave: 'mala' })
      .expect(401);
    await http()
      .post('/auth/login')
      .send({ correo: USUARIOS_PRUEBA.admin, clave: 'mala' })
      .expect(401);
    await http().post('/auth/login').send({}).expect(400);
  });

  it('POST /auth/registro es publico y asigna rol farmaceutico por defecto', async () => {
    const respuesta = await http()
      .post('/auth/registro')
      .send({
        nombre: 'Laura',
        correo: 'laura@vetstock.com',
        clave: '12345678',
      })
      .expect(201);

    expect(respuesta.body.data.usuario.rol).toBe('farmaceutico');
    expect(respuesta.body.data.usuario).not.toHaveProperty('clave');
    expect(respuesta.body.data.accessToken).toBeDefined();
  });

  it('POST /auth/registro responde 409 con correo repetido y 400 con rol invalido', async () => {
    await http()
      .post('/auth/registro')
      .send({
        nombre: 'Andres',
        correo: USUARIOS_PRUEBA.admin,
        clave: '12345678',
      })
      .expect(409);
    await http()
      .post('/auth/registro')
      .send({
        nombre: 'Laura',
        correo: 'laura@vetstock.com',
        clave: '12345678',
        rol: 'superman',
      })
      .expect(400);
    await http()
      .post('/auth/registro')
      .send({ nombre: 'Laura', correo: 'laura@vetstock.com', clave: '1234' })
      .expect(400);
  });

  it('POST /auth/registro con rol admin responde 403 sin ser admin', async () => {
    const datos = {
      nombre: 'Laura',
      correo: 'laura@vetstock.com',
      clave: '12345678',
      rol: 'admin',
    };

    await http().post('/auth/registro').send(datos).expect(403);
    await contexto
      .api('farmaceutico')
      .post('/auth/registro')
      .send(datos)
      .expect(403);
  });

  it('POST /auth/registro con rol admin funciona si lo pide un admin', async () => {
    const respuesta = await contexto
      .api('admin')
      .post('/auth/registro')
      .send({
        nombre: 'Laura',
        correo: 'laura@vetstock.com',
        clave: '12345678',
        rol: 'admin',
      })
      .expect(201);

    expect(respuesta.body.data.usuario.rol).toBe('admin');
  });

  it('POST /auth/registro permite al primer usuario ser admin', async () => {
    await contexto.app.get(DataSource).getRepository('Usuario').clear();

    await http()
      .post('/auth/registro')
      .send({
        nombre: 'Primero',
        correo: 'primero@vetstock.com',
        clave: '12345678',
        rol: 'admin',
      })
      .expect(201);
  });

  it('POST /auth/refresh renueva los tokens y rechaza tokens invalidos', async () => {
    const login = await http()
      .post('/auth/login')
      .send({ correo: USUARIOS_PRUEBA.veterinario, clave: CLAVE_PRUEBA });

    const renovado = await http()
      .post('/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(200);
    expect(renovado.body.data.usuario.correo).toBe(USUARIOS_PRUEBA.veterinario);

    await http()
      .post('/auth/refresh')
      .send({ refreshToken: login.body.data.accessToken })
      .expect(401);
    await http()
      .post('/auth/refresh')
      .send({ refreshToken: 'abc' })
      .expect(401);
  });

  it('GET /auth/perfil devuelve el usuario autenticado sin clave', async () => {
    const respuesta = await contexto
      .api('veterinario')
      .get('/auth/perfil')
      .expect(200);

    expect(respuesta.body.data).toMatchObject({
      id: 2,
      correo: USUARIOS_PRUEBA.veterinario,
      rol: 'veterinario',
    });
    expect(respuesta.body.data.createdAt).toBeDefined();
    expect(respuesta.body.data).not.toHaveProperty('clave');
  });

  it('GET /auth/perfil responde 401 sin token', () => {
    return http().get('/auth/perfil').expect(401);
  });

  describe('guard global', () => {
    it('responde 401 sin token en rutas protegidas', async () => {
      for (const ruta of [
        '/medicamentos',
        '/lotes',
        '/alertas',
        '/categorias',
      ]) {
        await http().get(ruta).expect(401);
      }
      await http().post('/dispensaciones').send({}).expect(401);
    });

    it('responde 401 con token malformado, firmado con otro secreto o de refresh', async () => {
      const login = await http()
        .post('/auth/login')
        .send({ correo: USUARIOS_PRUEBA.admin, clave: CLAVE_PRUEBA });

      for (const token of [
        'abc',
        login.body.data.refreshToken,
        `${login.body.data.accessToken}x`,
      ]) {
        await http()
          .get('/medicamentos')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);
      }
      await http()
        .get('/medicamentos')
        .set('Authorization', login.body.data.accessToken)
        .expect(401);
    });

    it('permite el acceso con un access token valido de cualquier rol', async () => {
      for (const rol of ['admin', 'veterinario', 'farmaceutico'] as const) {
        await contexto.api(rol).get('/medicamentos').expect(200);
      }
    });

    it('responde 401 si el usuario del token fue borrado', async () => {
      await contexto.app.get(DataSource).getRepository('Usuario').delete(3);

      await contexto.api('farmaceutico').get('/medicamentos').expect(401);
    });
  });
});

describe('Formato de errores (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  it('devuelve statusCode, message, error, path y timestamp', async () => {
    const respuesta = await contexto.api().get('/categorias/999').expect(404);
    expect(respuesta.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/categorias/999',
    });
    expect(typeof respuesta.body.message).toBe('string');
    expect(typeof respuesta.body.timestamp).toBe('string');
  });

  it('responde 400 con el mismo formato ante JSON mal formado', async () => {
    const respuesta = await contexto
      .api()
      .post('/categorias')
      .set('Content-Type', 'application/json')
      .send('{"nombre":')
      .expect(400);
    expect(respuesta.body).toMatchObject({
      statusCode: 400,
      path: '/categorias',
    });
  });
});
