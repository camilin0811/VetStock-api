import request from 'supertest';
import { AppPrueba, crearAppPrueba } from './app-prueba';

const medicamentoNuevo = {
  nombre: 'Suero oral',
  presentacion: 'Sobre 20 g',
  especie: 'general',
  precio: 1500,
  stockMinimo: 2,
  requiereFormula: false,
};

describe('Catalogo (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  describe('medicamentos', () => {
    it('GET /medicamentos filtra por q, especie y categoriaId', async () => {
      const api = contexto.api('veterinario');

      const porNombre = await api.get('/medicamentos?q=amox').expect(200);
      expect(porNombre.body.count).toBe(1);
      expect(porNombre.body.data[0].id).toBe(1);

      const porEspecie = await api.get('/medicamentos?especie=bovino');
      expect(porEspecie.body.data.map((m: { id: number }) => m.id)).toEqual([
        4,
      ]);

      const porCategoria = await api.get('/medicamentos?categoriaId=2');
      expect(porCategoria.body.data.map((m: { id: number }) => m.id)).toEqual([
        2,
      ]);
      expect(porCategoria.body.data[0].categorias).toHaveLength(1);

      const combinado = await api.get(
        '/medicamentos?q=vacuna&especie=general&categoriaId=2',
      );
      expect(combinado.body.count).toBe(1);

      const vacio = await api.get('/medicamentos?q=zzz');
      expect(vacio.body).toMatchObject({ data: [], count: 0 });
    });

    it('GET /medicamentos valida los filtros', async () => {
      const api = contexto.api();
      await api.get('/medicamentos?especie=dinosaurio').expect(400);
      await api.get('/medicamentos?categoriaId=abc').expect(400);
    });

    it('DELETE /medicamentos/:id elimina uno sin lotes', async () => {
      const creado = await contexto
        .api()
        .post('/medicamentos')
        .send(medicamentoNuevo)
        .expect(201);
      const id = creado.body.data.id;

      await contexto.api().delete(`/medicamentos/${id}`).expect(200);
      await contexto.api().get(`/medicamentos/${id}`).expect(404);
    });

    it('DELETE /medicamentos/:id responde 409 con lotes, 404 y 400', async () => {
      await contexto.api().delete('/medicamentos/1').expect(409);
      await contexto.api().delete('/medicamentos/999').expect(404);
      await contexto.api().delete('/medicamentos/abc').expect(400);
    });
  });

  describe('roles', () => {
    const http = () => request(contexto.app.getHttpServer());

    it('responde 401 sin token en las rutas de escritura', async () => {
      await http().post('/medicamentos').send(medicamentoNuevo).expect(401);
      await http().put('/medicamentos/1').send({}).expect(401);
      await http().delete('/medicamentos/1').expect(401);
    });

    it('responde 403 a un veterinario al escribir medicamentos', async () => {
      const api = contexto.api('veterinario');
      await api.post('/medicamentos').send(medicamentoNuevo).expect(403);
      await api.put('/medicamentos/1').send({ stockMinimo: 5 }).expect(403);
      await api.delete('/medicamentos/1').expect(403);
    });

    it('permite escribir medicamentos a un farmaceutico', async () => {
      const api = contexto.api('farmaceutico');
      const creado = await api
        .post('/medicamentos')
        .send(medicamentoNuevo)
        .expect(201);
      await api
        .put(`/medicamentos/${creado.body.data.id}`)
        .send({ stockMinimo: 5 })
        .expect(200);
      await api.delete(`/medicamentos/${creado.body.data.id}`).expect(200);
    });

    it('un veterinario si puede leer medicamentos', async () => {
      await contexto.api('veterinario').get('/medicamentos').expect(200);
      await contexto.api('veterinario').get('/medicamentos/1').expect(200);
    });
  });
});
