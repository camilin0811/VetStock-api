import { AppPrueba, crearAppPrueba } from './app-prueba';

describe('VetStock API (e2e)', () => {
  let contexto: AppPrueba;
  const api = (rol?: Parameters<AppPrueba['api']>[0]) => contexto.api(rol);

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  it('GET /categorias lista con count', () => {
    return api()
      .get('/categorias')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.count).toBe(4);
        expect(respuesta.body.data).toHaveLength(4);
      });
  });

  it('POST /categorias registra y GET /categorias/:id la devuelve', async () => {
    const creada = await api()
      .post('/categorias')
      .send({ nombre: 'Suplementos' })
      .expect(201);

    await api()
      .get(`/categorias/${creada.body.data.id}`)
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.nombre).toBe('Suplementos');
        expect(respuesta.body.descripcion).toBeNull();
      });
  });

  it('POST /categorias responde 409 con nombre duplicado y 400 sin nombre', async () => {
    await api().post('/categorias').send({ nombre: 'Vacunas' }).expect(409);
    await api().post('/categorias').send({}).expect(400);
  });

  it('PUT /categorias/:id actualiza y DELETE /categorias/:id elimina', async () => {
    await api()
      .put('/categorias/3')
      .send({ descripcion: 'Control del dolor' })
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.data.descripcion).toBe('Control del dolor');
      });
    await api().delete('/categorias/3').expect(200);
    await api().get('/categorias/3').expect(404);
  });

  it('GET /categorias/:id valida el id y responde 404', async () => {
    await api().get('/categorias/abc').expect(400);
    await api().get('/categorias/999').expect(404);
    await api().delete('/categorias/999').expect(404);
  });

  it('GET /medicamentos lista el catalogo', () => {
    return api()
      .get('/medicamentos')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.data.length).toBeGreaterThan(0);
        expect(respuesta.body.count).toBe(respuesta.body.data.length);
      });
  });

  it.each([
    ['/proveedores', 2],
    ['/lotes', 6],
    ['/dispensaciones', 2],
  ])('GET %s devuelve message, data y count', (ruta, total) => {
    return api()
      .get(ruta)
      .expect(200)
      .expect((respuesta) => {
        expect(typeof respuesta.body.message).toBe('string');
        expect(respuesta.body.data).toHaveLength(total);
        expect(respuesta.body.count).toBe(total);
      });
  });

  it('GET /medicamentos/:id y la lista incluyen categorias', async () => {
    await api()
      .get('/medicamentos/1')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.categorias).toEqual([
          expect.objectContaining({ id: 1, nombre: 'Antibioticos' }),
        ]);
      });
    await api()
      .get('/medicamentos')
      .expect((respuesta) => {
        expect(respuesta.body.data[0].categorias).toHaveLength(1);
      });
  });

  it('POST /medicamentos asigna categorias por id', () => {
    return api()
      .post('/medicamentos')
      .send({
        nombre: 'Ivermectina 1%',
        presentacion: 'Frasco 50 ml',
        especie: 'bovino',
        precio: 38000,
        stockMinimo: 6,
        requiereFormula: false,
        categoriaIds: [1, 4],
      })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body.data.categorias).toHaveLength(2);
      });
  });

  it('POST /medicamentos responde 404 con una categoria inexistente y 400 con ids invalidos', async () => {
    const base = {
      nombre: 'Ivermectina 1%',
      presentacion: 'Frasco 50 ml',
      especie: 'bovino',
      precio: 38000,
      stockMinimo: 6,
      requiereFormula: false,
    };
    await api()
      .post('/medicamentos')
      .send({ ...base, categoriaIds: [999] })
      .expect(404);
    await api()
      .post('/medicamentos')
      .send({ ...base, categoriaIds: ['a'] })
      .expect(400);
    await api()
      .post('/medicamentos')
      .send({ ...base, categoriaIds: 3 })
      .expect(400);
  });

  it('PUT /medicamentos/:id reemplaza las categorias', () => {
    return api()
      .put('/medicamentos/1')
      .send({ categoriaIds: [2, 3] })
      .expect(200)
      .expect((respuesta) => {
        expect(
          respuesta.body.data.categorias.map((c: { id: number }) => c.id),
        ).toEqual([2, 3]);
      });
  });

  it('DELETE /categorias/:id quita la categoria de los medicamentos', async () => {
    await api().delete('/categorias/1').expect(200);
    await api()
      .get('/medicamentos/1')
      .expect((respuesta) => {
        expect(respuesta.body.categorias).toEqual([]);
      });
  });

  it('POST /medicamentos rechaza datos invalidos', () => {
    return api()
      .post('/medicamentos')
      .send({ nombre: 'Sin precio', especie: 'dinosaurio' })
      .expect(400);
  });

  it('PUT /medicamentos/:id acepta una actualizacion parcial', () => {
    return api()
      .put('/medicamentos/1')
      .send({ stockMinimo: 30 })
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.data.stockMinimo).toBe(30);
        expect(respuesta.body.data.nombre).toBe('Amoxicilina 250 mg');
      });
  });

  it('PUT /medicamentos/:id valida los campos enviados', () => {
    return api()
      .put('/medicamentos/1')
      .send({ especie: 'dinosaurio' })
      .expect(400);
  });

  it('GET /medicamentos/:id responde 404 si no existe', () => {
    return api().get('/medicamentos/999').expect(404);
  });

  it('GET /lotes incluye medicamentoId, medicamento y proveedor', () => {
    return api()
      .get('/lotes?medicamentoId=2')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.count).toBe(2);
        for (const lote of respuesta.body.data) {
          expect(lote.medicamentoId).toBe(2);
          expect(lote.proveedorId).toBe(2);
          expect(lote.medicamento.nombre).toBe('Vacuna antirrabica');
          expect(lote.proveedor.nombre).toBe('Laboratorios Pet Salud');
        }
      });
  });

  it('POST /lotes registra un lote nuevo', () => {
    return api()
      .post('/lotes')
      .send({
        medicamentoId: 4,
        proveedorId: 1,
        numeroLote: 'ALB-301',
        cantidad: 10,
        fechaVencimiento: '2099-12-31',
      })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body.data.cantidad).toBe(10);
      });
  });

  it('POST /lotes rechaza un medicamento que no existe', () => {
    return api()
      .post('/lotes')
      .send({
        medicamentoId: 999,
        proveedorId: 1,
        numeroLote: 'X-1',
        cantidad: 1,
        fechaVencimiento: '2099-12-31',
      })
      .expect(404);
  });

  it('GET /inventario/:medicamentoId separa stock disponible y vencido', () => {
    return api()
      .get('/inventario/3')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.stockDisponible).toBe(10);
        expect(respuesta.body.stockVencido).toBe(4);
      });
  });

  it('GET /alertas devuelve las alertas del inventario', () => {
    return api()
      .get('/alertas')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.data.length).toBeGreaterThan(0);
        expect(respuesta.body.count).toBe(respuesta.body.data.length);
      });
  });

  it('POST /dispensaciones descuenta por FEFO y devuelve los lotes usados', () => {
    return api()
      .post('/dispensaciones')
      .send({
        medicamentoId: 2,
        cantidad: 35,
        mascota: 'Toby',
        veterinario: 'Dra. Paola Rosero',
      })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body.data.lotesUsados).toHaveLength(2);
      });
  });

  it('POST /dispensaciones rechaza medicamento con formula sin formula', () => {
    return api()
      .post('/dispensaciones')
      .send({
        medicamentoId: 1,
        cantidad: 1,
        mascota: 'Max',
        veterinario: 'Dra. Paola Rosero',
      })
      .expect(400);
  });

  it('GET /reportes/consumo devuelve el consumo por medicamento', () => {
    return api()
      .get('/reportes/consumo')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.detalle.length).toBeGreaterThan(0);
      });
  });

  it('GET /reportes/consumo rechaza fechas invalidas', () => {
    return api().get('/reportes/consumo?desde=ayer').expect(400);
  });

  it('GET /reportes/vencimientos calcula la perdida', () => {
    return api()
      .get('/reportes/vencimientos')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.totalPerdida).toBeGreaterThan(0);
      });
  });

  afterEach(async () => {
    await contexto.cerrar();
  });
});
