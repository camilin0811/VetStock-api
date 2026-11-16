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

  describe('proveedores', () => {
    const proveedorNuevo = {
      nombre: 'Vet Insumos del Sur',
      nit: '901555444-3',
      telefono: '3205554444',
      ciudad: 'Ipiales',
    };

    it('POST /proveedores acepta correo opcional y lo valida', async () => {
      const api = contexto.api();
      const sin = await api
        .post('/proveedores')
        .send(proveedorNuevo)
        .expect(201);
      expect(sin.body.data.correo).toBeNull();

      const con = await api
        .post('/proveedores')
        .send({ ...proveedorNuevo, nit: '1-1', correo: 'a@b.com' })
        .expect(201);
      expect(con.body.data.correo).toBe('a@b.com');

      await api
        .post('/proveedores')
        .send({ ...proveedorNuevo, nit: '2-2', correo: 'no-es-correo' })
        .expect(400);
    });

    it('GET /proveedores incluye correo null en los existentes', async () => {
      const respuesta = await contexto.api().get('/proveedores/1').expect(200);
      expect(respuesta.body.correo).toBeNull();
    });

    it('PUT /proveedores/:id actualiza parcialmente', async () => {
      const respuesta = await contexto
        .api('farmaceutico')
        .put('/proveedores/1')
        .send({ ciudad: 'Ipiales', correo: 'info@agrovet.com' })
        .expect(200);

      expect(respuesta.body.data).toMatchObject({
        id: 1,
        ciudad: 'Ipiales',
        correo: 'info@agrovet.com',
        nombre: 'Distribuidora Agrovet Narino',
      });
    });

    it('PUT /proveedores/:id responde 409, 404 y 400', async () => {
      const api = contexto.api();
      await api.put('/proveedores/1').send({ nit: '800987654-2' }).expect(409);
      await api.put('/proveedores/999').send({ ciudad: 'X' }).expect(404);
      await api.put('/proveedores/1').send({ correo: 'mal' }).expect(400);
    });

    it('DELETE /proveedores/:id elimina uno sin lotes y responde 409 con lotes', async () => {
      const api = contexto.api();
      const creado = await api.post('/proveedores').send(proveedorNuevo);

      await api.delete(`/proveedores/${creado.body.data.id}`).expect(200);
      await api.get(`/proveedores/${creado.body.data.id}`).expect(404);
      await api.delete('/proveedores/1').expect(409);
      await api.delete('/proveedores/999').expect(404);
    });

    it('responde 401 sin token y 403 a un veterinario al escribir', async () => {
      const http = () => request(contexto.app.getHttpServer());
      await http().put('/proveedores/1').send({}).expect(401);
      await http().delete('/proveedores/1').expect(401);

      const vet = contexto.api('veterinario');
      await vet.post('/proveedores').send(proveedorNuevo).expect(403);
      await vet.put('/proveedores/1').send({ ciudad: 'X' }).expect(403);
      await vet.delete('/proveedores/1').expect(403);
      await vet.get('/proveedores').expect(200);
    });
  });

  describe('categorias', () => {
    it('responde 401 sin token y 403 a un veterinario al escribir', async () => {
      const http = () => request(contexto.app.getHttpServer());
      await http().post('/categorias').send({ nombre: 'X' }).expect(401);
      await http().put('/categorias/1').send({}).expect(401);
      await http().delete('/categorias/1').expect(401);

      const vet = contexto.api('veterinario');
      await vet.post('/categorias').send({ nombre: 'Suplementos' }).expect(403);
      await vet.put('/categorias/1').send({ nombre: 'X' }).expect(403);
      await vet.delete('/categorias/1').expect(403);
      await vet.get('/categorias').expect(200);
    });

    it('permite escribir a admin y farmaceutico', async () => {
      await contexto
        .api('farmaceutico')
        .post('/categorias')
        .send({ nombre: 'Suplementos' })
        .expect(201);
      await contexto
        .api('admin')
        .post('/categorias')
        .send({ nombre: 'Insumos' })
        .expect(201);
    });
  });
});
