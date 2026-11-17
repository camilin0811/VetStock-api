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

    it('responde 400 si un texto excede el largo de su columna', async () => {
      const api = contexto.api('veterinario');
      const enviar = (campos: object) =>
        api.post('/dispensaciones').send({ ...dispensacion, ...campos });

      await enviar({ mascota: 'a'.repeat(101) }).expect(400);
      await enviar({ veterinario: 'a'.repeat(256) }).expect(400);
      await enviar({ formula: 'a'.repeat(101) }).expect(400);
      await enviar({ mascota: 'a'.repeat(100) }).expect(201);
    });

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
      // La mas reciente va primero
      expect(lista.body.data[0].usuario).toEqual({ id: 3, nombre: 'Camila' });
      expect(lista.body.data[2]).toMatchObject({
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

  describe('GET /dispensaciones con filtros', () => {
    const hace = (dias: number) =>
      new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

    it('filtra por desde y hasta', async () => {
      const api = contexto.api('veterinario');

      const recientes = await api.get(`/dispensaciones?desde=${hace(40)}`);
      expect(recientes.body.data.map((d: { id: number }) => d.id)).toEqual([1]);

      const antiguas = await api.get(`/dispensaciones?hasta=${hace(40)}`);
      expect(antiguas.body.data.map((d: { id: number }) => d.id)).toEqual([2]);

      const rango = await api.get(
        `/dispensaciones?desde=${hace(200)}&hasta=${hace(20)}`,
      );
      expect(rango.body.count).toBe(2);
    });

    it('filtra por medicamentoId y mascota', async () => {
      const api = contexto.api();
      const porMedicamento = await api.get('/dispensaciones?medicamentoId=3');
      expect(porMedicamento.body.data.map((d: { id: number }) => d.id)).toEqual(
        [2],
      );

      const porMascota = await api.get('/dispensaciones?mascota=MAX');
      expect(porMascota.body.data.map((d: { id: number }) => d.id)).toEqual([
        1,
      ]);

      const ninguna = await api.get('/dispensaciones?mascota=zzz');
      expect(ninguna.body).toMatchObject({ data: [], count: 0 });
    });

    it('valida los filtros', async () => {
      const api = contexto.api();
      await api.get('/dispensaciones?desde=ayer').expect(400);
      await api.get('/dispensaciones?medicamentoId=abc').expect(400);
      await api
        .get(`/dispensaciones?desde=${hace(1)}&hasta=${hace(5)}`)
        .expect(400);
    });
  });

  describe('POST /dispensaciones/:id/anular', () => {
    const crear = async () =>
      (
        await contexto
          .api('veterinario')
          .post('/dispensaciones')
          .send(dispensacion)
          .expect(201)
      ).body.data.id as number;

    it('responde 400 si el motivo excede 255 caracteres', async () => {
      const id = await crear();

      await contexto
        .api('admin')
        .post(`/dispensaciones/${id}/anular`)
        .send({ motivo: 'a'.repeat(256) })
        .expect(400);
    });

    it('responde 401 sin token y 403 a un veterinario', async () => {
      const id = await crear();

      await request(contexto.app.getHttpServer())
        .post(`/dispensaciones/${id}/anular`)
        .send({ motivo: 'x' })
        .expect(401);
      await contexto
        .api('veterinario')
        .post(`/dispensaciones/${id}/anular`)
        .send({ motivo: 'x' })
        .expect(403);
    });

    it.each(['admin', 'farmaceutico'] as const)(
      'permite anular al rol %s: restaura stock y deja movimientos ANULACION',
      async (rol) => {
        const id = await crear();

        const respuesta = await contexto
          .api(rol)
          .post(`/dispensaciones/${id}/anular`)
          .send({ motivo: 'Error de digitacion' })
          .expect(200);

        expect(respuesta.body.data).toMatchObject({
          id,
          estado: 'ANULADA',
          lotesUsados: [
            expect.objectContaining({ loteId: 2, cantidad: 30 }),
            expect.objectContaining({ loteId: 3, cantidad: 5 }),
          ],
        });
        const inventario = await contexto.api().get('/inventario/2');
        expect(inventario.body.stockDisponible).toBe(42);

        const kardex = await contexto.api().get('/movimientos?tipo=ANULACION');
        expect(kardex.body.count).toBe(2);
        expect(kardex.body.data[0]).toMatchObject({
          tipo: 'ANULACION',
          cantidad: 5,
          usuario: { id: rol === 'admin' ? 1 : 3 },
        });
      },
    );

    it('responde 409 si ya estaba anulada', async () => {
      const id = await crear();
      await contexto
        .api()
        .post(`/dispensaciones/${id}/anular`)
        .send({ motivo: 'Primera' })
        .expect(200);

      await contexto
        .api()
        .post(`/dispensaciones/${id}/anular`)
        .send({ motivo: 'Segunda' })
        .expect(409);
      const inventario = await contexto.api().get('/inventario/2');
      expect(inventario.body.stockDisponible).toBe(42);
    });

    it('responde 400 sin motivo, 404 y 400 con id invalido', async () => {
      const id = await crear();
      const api = contexto.api();
      await api.post(`/dispensaciones/${id}/anular`).send({}).expect(400);
      await api
        .post('/dispensaciones/999/anular')
        .send({ motivo: 'x' })
        .expect(404);
      await api
        .post('/dispensaciones/abc/anular')
        .send({ motivo: 'x' })
        .expect(400);
    });

    it('GET /dispensaciones/:id muestra el estado ANULADA', async () => {
      const id = await crear();
      await contexto
        .api()
        .post(`/dispensaciones/${id}/anular`)
        .send({ motivo: 'x' });

      const respuesta = await contexto.api().get(`/dispensaciones/${id}`);
      expect(respuesta.body.estado).toBe('ANULADA');
    });

    it('una dispensacion anulada no cuenta en el reporte de consumo', async () => {
      const id = await crear();
      const consumo = async () =>
        (await contexto.api().get('/reportes/consumo?desde=2000-01-01')).body;

      const antes = await consumo();
      await contexto
        .api()
        .post(`/dispensaciones/${id}/anular`)
        .send({ motivo: 'x' });
      const despues = await consumo();

      expect(antes.totalUnidades - despues.totalUnidades).toBe(35);
    });
  });
});
