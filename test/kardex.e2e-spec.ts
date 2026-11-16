import request from 'supertest';
import { AppPrueba, crearAppPrueba } from './app-prueba';

describe('Inventario y kardex (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  describe('movimientos', () => {
    it('responde 401 sin token', () => {
      return request(contexto.app.getHttpServer())
        .get('/movimientos')
        .expect(401);
    });

    it('GET /movimientos lista con la forma del contrato', async () => {
      const respuesta = await contexto
        .api('veterinario')
        .get('/movimientos')
        .expect(200);

      expect(respuesta.body.count).toBe(8);
      expect(respuesta.body.data).toHaveLength(8);
      expect(respuesta.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          tipo: expect.any(String),
          cantidad: expect.any(Number),
          loteId: expect.any(Number),
          medicamentoId: expect.any(Number),
          medicamento: expect.objectContaining({ nombre: expect.any(String) }),
          numeroLote: expect.any(String),
          fecha: expect.any(String),
        }),
      );
    });

    it('GET /movimientos filtra por medicamentoId y tipo', async () => {
      const api = contexto.api();
      const porMedicamento = await api.get('/movimientos?medicamentoId=3');
      expect(porMedicamento.body.count).toBe(3);

      const salidas = await api.get('/movimientos?tipo=SALIDA');
      expect(salidas.body.count).toBe(2);

      const ambos = await api.get('/movimientos?medicamentoId=3&tipo=SALIDA');
      expect(ambos.body.count).toBe(1);
      expect(ambos.body.data[0].usuario).toBeNull();
    });

    it('GET /movimientos valida los filtros', async () => {
      await contexto.api().get('/movimientos?tipo=OTRO').expect(400);
      await contexto.api().get('/movimientos?medicamentoId=abc').expect(400);
    });

    it('POST /lotes registra una ENTRADA a nombre del usuario autenticado', async () => {
      await contexto
        .api('farmaceutico')
        .post('/lotes')
        .send({
          medicamentoId: 4,
          proveedorId: 1,
          numeroLote: 'ALB-301',
          cantidad: 10,
          fechaVencimiento: '2099-12-31',
        })
        .expect(201);

      const respuesta = await contexto
        .api()
        .get('/movimientos?medicamentoId=4');
      expect(respuesta.body.data[0]).toMatchObject({
        tipo: 'ENTRADA',
        cantidad: 10,
        numeroLote: 'ALB-301',
        usuario: { id: 3, nombre: 'Camila' },
      });
    });
  });

  describe('GET /inventario', () => {
    it('responde 401 sin token', () => {
      return request(contexto.app.getHttpServer())
        .get('/inventario')
        .expect(401);
    });

    it('lista el stock de todos los medicamentos con su estado', async () => {
      const respuesta = await contexto
        .api('veterinario')
        .get('/inventario')
        .expect(200);

      expect(respuesta.body.count).toBe(4);
      const amoxicilina = respuesta.body.data.find(
        (item: { medicamento: { id: number } }) => item.medicamento.id === 1,
      );
      expect(amoxicilina).toMatchObject({
        disponible: 15,
        vencido: 0,
        estado: 'STOCK_BAJO',
      });
      expect(amoxicilina.medicamento.categorias).toHaveLength(1);
    });

    it('GET /inventario/:medicamentoId conserva la forma anterior', async () => {
      const respuesta = await contexto.api().get('/inventario/3').expect(200);
      expect(respuesta.body).toMatchObject({
        stockDisponible: 10,
        stockVencido: 4,
      });
      await contexto.api().get('/inventario/abc').expect(400);
    });
  });
});
