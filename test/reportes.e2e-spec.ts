import request from 'supertest';
import { AppPrueba, crearAppPrueba } from './app-prueba';

describe('Reportes (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  it('responde 401 sin token', async () => {
    const http = () => request(contexto.app.getHttpServer());
    await http().get('/reportes/consumo').expect(401);
    await http().get('/reportes/vencimientos').expect(401);
    await http().get('/reportes/stock').expect(401);
    await http().get('/reportes/proveedores').expect(401);
  });

  describe('GET /reportes/consumo', () => {
    it('mantiene la forma: desde, hasta, totales y detalle', async () => {
      const respuesta = await contexto
        .api('veterinario')
        .get('/reportes/consumo?desde=2000-01-01')
        .expect(200);

      expect(respuesta.body).toMatchObject({
        desde: '2000-01-01',
        totalUnidades: 31,
        totalVentas: 25 * 18000 + 6 * 32000,
      });
      expect(respuesta.body.hasta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(respuesta.body.detalle[0]).toMatchObject({
        medicamento: expect.objectContaining({
          id: 1,
          nombre: 'Amoxicilina 250 mg',
        }),
        unidades: 25,
        total: 450000,
      });
    });

    it('por defecto toma los ultimos 30 dias', async () => {
      const respuesta = await contexto
        .api()
        .get('/reportes/consumo')
        .expect(200);

      expect(respuesta.body.detalle).toHaveLength(1);
      expect(respuesta.body.totalUnidades).toBe(25);
    });

    it('rechaza fechas invalidas o invertidas', async () => {
      await contexto.api().get('/reportes/consumo?desde=ayer').expect(400);
      await contexto
        .api()
        .get('/reportes/consumo?desde=2030-01-02&hasta=2030-01-01')
        .expect(400);
    });
  });

  describe('GET /reportes/vencimientos', () => {
    it('mantiene la forma: totalPerdida y lotes con lote, medicamento y perdida', async () => {
      const respuesta = await contexto
        .api()
        .get('/reportes/vencimientos')
        .expect(200);

      expect(respuesta.body.totalPerdida).toBe(128000);
      expect(respuesta.body.lotes).toHaveLength(1);
      expect(respuesta.body.lotes[0]).toMatchObject({
        lote: expect.objectContaining({ id: 4, numeroLote: 'MLX-050' }),
        medicamento: expect.objectContaining({ id: 3 }),
        perdida: 128000,
      });
    });
  });

  describe('GET /reportes/stock', () => {
    it('devuelve items y valorTotal segun el contrato', async () => {
      const respuesta = await contexto
        .api('farmaceutico')
        .get('/reportes/stock')
        .expect(200);

      expect(typeof respuesta.body.message).toBe('string');
      expect(respuesta.body.data.valorTotal).toBe(2765000);
      expect(respuesta.body.data.items).toHaveLength(4);
      expect(respuesta.body.data.items[0]).toEqual({
        medicamento: { id: 4, nombre: 'Desparasitante Albendazol' },
        unidades: 25,
        valor: 1125000,
      });
    });
  });

  describe('GET /reportes/proveedores', () => {
    it('devuelve la lista por proveedor segun el contrato', async () => {
      const respuesta = await contexto
        .api('veterinario')
        .get('/reportes/proveedores')
        .expect(200);

      expect(respuesta.body.data).toEqual([
        {
          proveedor: { id: 1, nombre: 'Distribuidora Agrovet Narino' },
          lotes: 4,
          unidades: 85,
          valor: 40 * 18000 + 20 * 32000 + 25 * 45000,
        },
        {
          proveedor: { id: 2, nombre: 'Laboratorios Pet Salud' },
          lotes: 2,
          unidades: 42,
          valor: 1050000,
        },
      ]);
    });

    it('acepta desde y hasta y los valida', async () => {
      const hace = (dias: number) =>
        new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

      const respuesta = await contexto
        .api()
        .get(`/reportes/proveedores?desde=${hace(15)}`)
        .expect(200);
      expect(
        respuesta.body.data.map(
          (p: { proveedor: { id: number } }) => p.proveedor.id,
        ),
      ).toEqual([2]);

      await contexto.api().get('/reportes/proveedores?desde=ayer').expect(400);
      await contexto
        .api()
        .get('/reportes/proveedores?desde=2030-01-02&hasta=2030-01-01')
        .expect(400);
    });
  });
});
