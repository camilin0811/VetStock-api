import request from 'supertest';
import { AppPrueba, crearAppPrueba } from './app-prueba';
import { CLAVE_PRUEBA, USUARIOS_PRUEBA } from './bd-prueba';

describe('Usuarios (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  it('responde 401 sin token', async () => {
    const http = () => request(contexto.app.getHttpServer());
    await http().get('/usuarios').expect(401);
    await http().get('/usuarios/1').expect(401);
    await http().put('/usuarios/1').send({}).expect(401);
    await http().delete('/usuarios/1').expect(401);
  });

  it.each(['veterinario', 'farmaceutico'] as const)(
    'responde 403 a un %s en todas las rutas',
    async (rol) => {
      const api = contexto.api(rol);
      await api.get('/usuarios').expect(403);
      await api.get('/usuarios/1').expect(403);
      await api.put('/usuarios/1').send({ nombre: 'X' }).expect(403);
      await api.delete('/usuarios/3').expect(403);
    },
  );

  it('GET /usuarios lista con count y sin clave (admin)', async () => {
    const respuesta = await contexto.api().get('/usuarios').expect(200);

    expect(respuesta.body.count).toBe(3);
    expect(respuesta.body.data).toHaveLength(3);
    expect(JSON.stringify(respuesta.body)).not.toContain('clave');
  });

  it('GET /usuarios/:id devuelve el usuario y valida el id', async () => {
    const respuesta = await contexto.api().get('/usuarios/2').expect(200);
    expect(respuesta.body).toMatchObject({
      id: 2,
      rol: 'veterinario',
      correo: USUARIOS_PRUEBA.veterinario,
    });
    expect(respuesta.body).not.toHaveProperty('clave');

    await contexto.api().get('/usuarios/999').expect(404);
    await contexto.api().get('/usuarios/abc').expect(400);
  });

  it('PUT /usuarios/:id actualiza rol y nombre', async () => {
    const respuesta = await contexto
      .api()
      .put('/usuarios/3')
      .send({ nombre: 'Camila Perez', rol: 'veterinario' })
      .expect(200);

    expect(respuesta.body.data).toMatchObject({
      nombre: 'Camila Perez',
      rol: 'veterinario',
    });
    expect(respuesta.body.data).not.toHaveProperty('clave');
  });

  it('PUT /usuarios/:id cambia la clave y el usuario puede ingresar con ella', async () => {
    await contexto
      .api()
      .put('/usuarios/3')
      .send({ clave: 'NuevaClave456*' })
      .expect(200);

    const http = () => request(contexto.app.getHttpServer());
    await http()
      .post('/auth/login')
      .send({ correo: USUARIOS_PRUEBA.farmaceutico, clave: CLAVE_PRUEBA })
      .expect(401);
    await http()
      .post('/auth/login')
      .send({ correo: USUARIOS_PRUEBA.farmaceutico, clave: 'NuevaClave456*' })
      .expect(201);
  });

  it('PUT /usuarios/:id valida datos y correo repetido', async () => {
    const api = contexto.api();
    await api.put('/usuarios/3').send({ rol: 'superman' }).expect(400);
    await api.put('/usuarios/3').send({ correo: 'no-es-correo' }).expect(400);
    await api
      .put('/usuarios/3')
      .send({ correo: USUARIOS_PRUEBA.admin })
      .expect(409);
    await api.put('/usuarios/999').send({ nombre: 'X' }).expect(404);
  });

  it('DELETE /usuarios/:id elimina a otro usuario y su token deja de servir', async () => {
    await contexto.api().delete('/usuarios/3').expect(200);
    await contexto.api().get('/usuarios/3').expect(404);
    await contexto.api('farmaceutico').get('/medicamentos').expect(401);
    await contexto.api().delete('/usuarios/999').expect(404);
  });

  it('DELETE /usuarios/:id no deja que el admin se borre a si mismo', async () => {
    await contexto.api().delete('/usuarios/1').expect(400);
  });
});
