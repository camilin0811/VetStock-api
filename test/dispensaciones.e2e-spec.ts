import request from 'supertest';
import { AppPrueba, crearAppPrueba } from './app-prueba';

const dispensacion = {
  medicamentoId: 2,
  cantidad: 35,
  mascota: 'Toby',
  veterinario: 'Dra. Paola Rosero',
};

describe('Dispensaciones (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  describe('POST /dispensaciones', () => {
    it('responde 401 sin token', async () => {
      const http = () => request(contexto.app.getHttpServer());
      await http().post('/dispensaciones').send(dispensacion).expect(401);
      await http().get('/dispensaciones').expect(401);
      await http().get('/dispensaciones/1').expect(401);
    });

    it.each(['admin', 'veterinario', 'farmaceutico'] as const)(
      'permite dispensar al rol %s y registra su usuario',
      async (rol) => {
        const respuesta = await contexto
          .api(rol)
          .post('/dispensaciones')
          .send(dispensacion)
          .expect(201);

        const ids = { admin: 1, veterinario: 2, farmaceutico: 3 };
        expect(respuesta.body.data.usuario.id).toBe(ids[rol]);
      },
    );

    it('devuelve la forma del contrato con lotes usados y usuario', async () => {
      const respuesta = await contexto
        .api('veterinario')
        .post('/dispensaciones')
        .send(dispensacion)
        .expect(201);

      expect(respuesta.body.data).toMatchObject({
        medicamentoId: 2,
        cantidad: 35,
        mascota: 'Toby',
        formula: null,
        total: 875000,
        estado: 'ACTIVA',
        usuario: { id: 2, nombre: 'Paola' },
      });
      expect(respuesta.body.data.medicamento.nombre).toBe('Vacuna antirrabica');
      expect(respuesta.body.data.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(respuesta.body.data.lotesUsados).toEqual([
        expect.objectContaining({
          loteId: 2,
          numeroLote: 'VAR-101',
          cantidad: 30,
          fechaVencimiento: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
        expect.objectContaining({ loteId: 3, cantidad: 5 }),
      ]);
      expect(respuesta.body.data.usuario).not.toHaveProperty('correo');
    });

    it('GET /dispensaciones y /:id incluyen usuario y estado', async () => {
      const creada = await contexto
        .api('farmaceutico')
        .post('/dispensaciones')
        .send(dispensacion);

      const lista = await contexto.api().get('/dispensaciones').expect(200);
      expect(lista.body.count).toBe(3);
      expect(lista.body.data[2].usuario).toEqual({ id: 3, nombre: 'Camila' });
      expect(lista.body.data[0]).toMatchObject({
        estado: 'ACTIVA',
        usuario: null,
      });

      const una = await contexto
        .api()
        .get(`/dispensaciones/${creada.body.data.id}`)
        .expect(200);
      expect(una.body.usuario).toEqual({ id: 3, nombre: 'Camila' });
    });

    it('la dispensacion conserva usuario null si el usuario se elimina', async () => {
      const creada = await contexto
        .api('farmaceutico')
        .post('/dispensaciones')
        .send(dispensacion);

      await contexto.api().delete('/usuarios/3').expect(200);

      const una = await contexto
        .api()
        .get(`/dispensaciones/${creada.body.data.id}`)
        .expect(200);
      expect(una.body.usuario).toBeNull();
    });
  });

  it('POST /dispensaciones deja movimientos SALIDA en el kardex', async () => {
    await contexto
      .api('veterinario')
      .post('/dispensaciones')
      .send(dispensacion)
      .expect(201);

    const kardex = await contexto
      .api()
      .get('/movimientos?medicamentoId=2&tipo=SALIDA')
      .expect(200);
    expect(kardex.body.count).toBe(2);
    expect(kardex.body.data[0]).toMatchObject({
      tipo: 'SALIDA',
      cantidad: 5,
      numeroLote: 'VAR-102',
      usuario: { id: 2, nombre: 'Paola' },
    });
  });

  it('POST /dispensaciones valida datos, formula y stock', async () => {
    const api = contexto.api();
    await api.post('/dispensaciones').send({}).expect(400);
    await api
      .post('/dispensaciones')
      .send({ ...dispensacion, medicamentoId: 1 })
      .expect(400);
    await api
      .post('/dispensaciones')
      .send({ ...dispensacion, cantidad: 500 })
      .expect(400);
    await api
      .post('/dispensaciones')
      .send({ ...dispensacion, medicamentoId: 999 })
      .expect(404);
  });
});
